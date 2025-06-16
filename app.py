import os
import threading
import time
from flask import Flask, jsonify, request, send_file, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from scapy.all import sniff, wrpcap, IP, Ether, Packet
from geoip2.database import Reader
import geoip2.errors

SECRET_KEY = os.environ.get('SECRET_KEY', 'd2a7a7a8d8b1e0f0c0d8e8f8a8b8c8d8')

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5500", "http://localhost:5500"])
app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)


GEOIP_DB_PATH = 'GeoLite2-City.mmdb'
PCAP_FILE_PATH = 'capture.pcap'

# --- Database Model ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)

captured_packets_data = [] 
raw_scapy_packets = []  
capture_lock = threading.Lock()
is_capturing = False


def get_geoip_data(ip_address):
    if not ip_address or ip_address.startswith(('192.168.', '10.', '172.16.', '127.0.0.1')):
        return {'type': 'private', 'network': 'LAN', 'city': 'Local Network', 'country': 'Local Network'}
    
    try:
        if not os.path.exists(GEOIP_DB_PATH):
            return {'type': 'unknown', 'city': 'GeoIP DB not found', 'country': 'N/A'}
        
        with Reader(GEOIP_DB_PATH) as reader:
            response = reader.city(ip_address)
            return {
                'type': 'public',
                'city': response.city.name or 'Unknown City',
                'country': response.country.name or 'Unknown Country',
                'iso_code': response.country.iso_code,
                'coordinates': (response.location.latitude, response.location.longitude)
            }
    except geoip2.errors.AddressNotFoundError:
        return {'type': 'unknown', 'city': 'Unknown', 'country': 'Unknown'}
    except Exception as e:
        print(f"GeoIP Error: {e}")
        return {'type': 'error', 'city': 'GeoIP Error', 'country': 'N/A'}


def process_packet(packet: Packet):
    global is_capturing
    if not is_capturing:
        return

    packet_data = {
        "timestamp": time.time(),
        "summary": packet.summary(),
        "size": len(packet),
        "is_mac": False
    }
    
    if packet.haslayer(IP):
        ip_layer = packet.getlayer(IP)
        packet_data.update({
            "src": ip_layer.src,
            "dst": ip_layer.dst,
            "protocol": ip_layer.payload.name if hasattr(packet, "payload") else "IP",
            "src_geo": get_geoip_data(ip_layer.src),
            "dst_geo": get_geoip_data(ip_layer.dst)
        })
    elif packet.haslayer(Ether):
        eth_layer = packet.getlayer(Ether)
        packet_data.update({
            "src": eth_layer.src,
            "dst": eth_layer.dst,
            "protocol": "Ethernet",
            "is_mac": True
        })
    
    with capture_lock:
        captured_packets_data.append(packet_data)
        raw_scapy_packets.append(packet)


def capture_packets_thread():
    sniff(prn=process_packet, store=False, stop_filter=lambda p: not is_capturing)
    print("Sniffing thread has stopped.")


@app.route('/start_capture', methods=['POST'])
def start_capture():
    global is_capturing
    if not is_capturing:
        is_capturing = True
        threading.Thread(target=capture_packets_thread, daemon=True).start()
        return jsonify({"status": "Capture started"}), 200
    return jsonify({"status": "Already capturing"}), 400


@app.route('/stop_capture', methods=['POST'])
def stop_capture():
    global is_capturing
    is_capturing = False
    return jsonify({"status": "Capture stopped"}), 200


@app.route('/get_packets', methods=['GET'])
def get_packets():
    since = request.args.get('since', 0, type=float)
    with capture_lock:
        if since > 0:
            filtered = [p for p in captured_packets_data if p['timestamp'] > since]
            return jsonify(filtered)
        return jsonify(list(captured_packets_data))


@app.route('/clear_packets', methods=['POST'])
def clear_packets():
    global captured_packets_data, raw_scapy_packets
    with capture_lock:
        captured_packets_data.clear()
        raw_scapy_packets.clear()
    return jsonify({"status": "Packets cleared"}), 200


@app.route('/save_capture', methods=['POST'])
def save_capture():
    with capture_lock:
        if raw_scapy_packets:
            try:
                wrpcap(PCAP_FILE_PATH, raw_scapy_packets)
                return jsonify({"status": "Capture saved", "file": PCAP_FILE_PATH}), 200
            except Exception as e:
                print(f"Error saving PCAP file: {e}")
                return jsonify({"status": "Error saving file", "error": str(e)}), 500
    return jsonify({"status": "No packets to save", "file": None}), 404


@app.route('/download_pcap', methods=['GET'])
def download_pcap():
    if os.path.exists(PCAP_FILE_PATH):
        return send_file(PCAP_FILE_PATH, as_attachment=True, download_name='netwatch_capture.pcap')
    return jsonify({"error": "File not found. Please save a capture first."}), 404


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({"error": "Missing data"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 409
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already taken"}), 409

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], email=data['email'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.check_password_hash(user.password, data['password']):
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({
            "message": "Login successful",
            "username": user.username
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401


@app.route('/check_login', methods=['GET'])
def check_login():
    if 'user_id' in session:
        return jsonify({"logged_in": True, "username": session.get('username')})
    return jsonify({"logged_in": False})


@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)