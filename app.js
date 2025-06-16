let autoUpdate = false;
let autoUpdateInterval = null;
let lastPacketTimestamp = null;
let packets = [];
let isCapturing = false;
let currentChartType = 'bar';
let trafficLineChart = null;
let trafficPieChart = null;
let isLoggedIn = false;

const MAX_FRONTEND_PACKETS = 5000;
const PACKETS_PER_PAGE = 100;
let currentPageByProtocol = {};

const themeToggleBtn = document.getElementById("themeToggleBtn");
const currentTheme = localStorage.getItem('theme');



// Get all buttons
const buttons = [
    document.getElementById("exportJsonBtn"),
    document.getElementById("exportCsvBtn"),
    document.getElementById("downloadPcapBtn")
];

const captureTimer = {
    intervalId: null,
    startTime: 0,
    element: null
};

document.addEventListener('DOMContentLoaded', () => {

    const startCaptureBtn = document.getElementById("startCaptureBtn");
    const stopCaptureBtn = document.getElementById("stopCaptureBtn");
    const clearPacketsBtn = document.getElementById("clearPacketsBtn");
    const autoUpdateBtn = document.getElementById("autoUpdateBtn");
    const searchInput = document.getElementById("searchInput");
    const toggleContainer = document.getElementById("toggleContainer");
    const exportJsonBtn = document.getElementById("exportJsonBtn");
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    const downloadPcapBtn = document.getElementById("downloadPcapBtn");
    const testAnomaliesBtn = document.getElementById("testAnomaliesBtn");
    const protocolFilterDropdown = document.getElementById('protocolFilter');

    const authBtn = document.getElementById("authBtn");
    const userModal = document.getElementById("userModal");
    const closeUserModalBtn = document.getElementById("closeUserModal");
    const showLoginBtn = document.getElementById("showLoginBtn");
    const showRegisterBtn = document.getElementById("showRegisterBtn");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    
    const mainContent = document.querySelector('.main-content');
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sidebar = document.querySelector('.sidebar');

    fetchPackets();
    checkLoginStatus();

    startCaptureBtn.addEventListener('click', startCapture);
    stopCaptureBtn.addEventListener('click', stopCapture);
    clearPacketsBtn.addEventListener('click', clearPackets);
    autoUpdateBtn.addEventListener('click', toggleAutoUpdate);
    toggleContainer.addEventListener('click', toggleChartType);
    searchInput.addEventListener('input', searchPackets);

    exportJsonBtn.addEventListener('click', () => exportPackets('json'));
    exportCsvBtn.addEventListener('click', () => exportPackets('csv'));
    downloadPcapBtn.addEventListener('click', downloadPcap);
    testAnomaliesBtn.addEventListener('click', testAllAnomalies);

    protocolFilterDropdown.addEventListener('change', () => {
        currentPageByProtocol = {};
        updateUI(packets);
    });

    authBtn.addEventListener('click', () => {
        if (authBtn.textContent === 'Logout') {
            logout();
        } else {
            userModal.style.display = 'flex';
        }
    });
    closeUserModalBtn.addEventListener('click', () => userModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === userModal) {
            userModal.style.display = 'none';
        }
    });
    showLoginBtn.addEventListener('click', () => switchAuthForm('login'));
    showRegisterBtn.addEventListener('click', () => switchAuthForm('register'));

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    themeToggleBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    if (currentTheme) {
        setTheme(currentTheme);
    } else {
        setTheme('dark');
    }

    captureTimer.element = document.getElementById('captureTimer');


    const scrollButtonsContainer = document.getElementById('scrollButtons');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

    function handleScroll() {
        if (mainContent.scrollTop > 300) {
            scrollButtonsContainer.classList.add('visible');
        } else {
            scrollButtonsContainer.classList.remove('visible');
        }
    }

    function scrollToTop() {
        mainContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function scrollToBottom() {
        mainContent.scrollTo({
            top: mainContent.scrollHeight,
            behavior: 'smooth'
        });
    }

    mainContent.addEventListener('scroll', handleScroll);
    scrollToTopBtn.addEventListener('click', scrollToTop);
    scrollToBottomBtn.addEventListener('click', scrollToBottom);

    // --- UPDATED SIDEBAR LOGIC ---
    menuToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents the main content click listener from firing immediately
        sidebar.classList.toggle('show');
    });

    mainContent.addEventListener('click', () => {
        // If the sidebar is open, a click on the main content will close it
        if (sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });
    // --- END OF UPDATED SIDEBAR LOGIC ---
});

// document.addEventListener('DOMContentLoaded', () => {

//     const startCaptureBtn = document.getElementById("startCaptureBtn");
//     const stopCaptureBtn = document.getElementById("stopCaptureBtn");
//     const clearPacketsBtn = document.getElementById("clearPacketsBtn");
//     const autoUpdateBtn = document.getElementById("autoUpdateBtn");
//     const searchInput = document.getElementById("searchInput");
//     const toggleContainer = document.getElementById("toggleContainer");
//     const exportJsonBtn = document.getElementById("exportJsonBtn");
//     const exportCsvBtn = document.getElementById("exportCsvBtn");
//     const downloadPcapBtn = document.getElementById("downloadPcapBtn");
//     const testAnomaliesBtn = document.getElementById("testAnomaliesBtn");
//     const protocolFilterDropdown = document.getElementById('protocolFilter');

//     const authBtn = document.getElementById("authBtn");
//     const userModal = document.getElementById("userModal");
//     const closeUserModalBtn = document.getElementById("closeUserModal");
//     const showLoginBtn = document.getElementById("showLoginBtn");
//     const showRegisterBtn = document.getElementById("showRegisterBtn");
//     const loginForm = document.getElementById("loginForm");
//     const registerForm = document.getElementById("registerForm");

//     fetchPackets();
//     checkLoginStatus();

//     startCaptureBtn.addEventListener('click', startCapture);
//     stopCaptureBtn.addEventListener('click', stopCapture);
//     clearPacketsBtn.addEventListener('click', clearPackets);
//     autoUpdateBtn.addEventListener('click', toggleAutoUpdate);
//     toggleContainer.addEventListener('click', toggleChartType);
//     searchInput.addEventListener('input', searchPackets);

//     exportJsonBtn.addEventListener('click', () => exportPackets('json'));
//     exportCsvBtn.addEventListener('click', () => exportPackets('csv'));
//     downloadPcapBtn.addEventListener('click', downloadPcap);
//     testAnomaliesBtn.addEventListener('click', testAllAnomalies);

//     protocolFilterDropdown.addEventListener('change', () => {
//         currentPageByProtocol = {};
//         updateUI(packets);
//     });

//     authBtn.addEventListener('click', () => {
//         if (authBtn.textContent === 'Logout') {
//             logout();
//         } else {
//             userModal.style.display = 'flex';
//         }
//     });
//     closeUserModalBtn.addEventListener('click', () => userModal.style.display = 'none');
//     window.addEventListener('click', (e) => {
//         if (e.target === userModal) {
//             userModal.style.display = 'none';
//         }
//     });
//     showLoginBtn.addEventListener('click', () => switchAuthForm('login'));
//     showRegisterBtn.addEventListener('click', () => switchAuthForm('register'));

//     loginForm.addEventListener('submit', handleLogin);
//     registerForm.addEventListener('submit', handleRegister);

//     themeToggleBtn.addEventListener('click', () => {
//         const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
//         setTheme(newTheme);
//     });

//     if (currentTheme) {
//         setTheme(currentTheme);
//     } else {
//         setTheme('dark');
//     }

//     captureTimer.element = document.getElementById('captureTimer');


//     const mainContent = document.querySelector('.main-content');
//     const scrollButtonsContainer = document.getElementById('scrollButtons');
//     const scrollToTopBtn = document.getElementById('scrollToTopBtn');
//     const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

//     function handleScroll() {
//         if (mainContent.scrollTop > 300) {
//             scrollButtonsContainer.classList.add('visible');
//         } else {
//             scrollButtonsContainer.classList.remove('visible');
//         }
//     }

//     function scrollToTop() {
//         mainContent.scrollTo({
//             top: 0,
//             behavior: 'smooth'
//         });
//     }

//     function scrollToBottom() {
//         mainContent.scrollTo({
//             top: mainContent.scrollHeight,
//             behavior: 'smooth'
//         });
//     }

//     mainContent.addEventListener('scroll', handleScroll);
//     scrollToTopBtn.addEventListener('click', scrollToTop);
//     scrollToBottomBtn.addEventListener('click', scrollToBottom);
// });

function startTimer() {
    if (captureTimer.intervalId) clearInterval(captureTimer.intervalId);

    captureTimer.startTime = Date.now();
    captureTimer.element.style.display = 'flex';
    const timerDisplay = captureTimer.element.querySelector('#timerDisplay');

    captureTimer.intervalId = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - captureTimer.startTime) / 1000);
        const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(elapsedSeconds % 60).padStart(2, '0');
        timerDisplay.textContent = `${h}:${m}:${s}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(captureTimer.intervalId);
    captureTimer.intervalId = null;
    if (captureTimer.element) {
        captureTimer.element.style.display = 'none';
    }
}

function resetTimer() {
    stopTimer();
    if (captureTimer.element) {
        captureTimer.element.querySelector('#timerDisplay').textContent = '00:00:00';
        if (isCapturing)
            startTimer();
    }
}


function startCapture() {
    fetch('http://127.0.0.1:5000/start_capture', { method: 'POST', credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            showCaptureModal("Capture Started!", "success");
            const startBtn = document.getElementById("startCaptureBtn");
            startBtn.classList.add("active-btn");
            startBtn.innerHTML = "Capturing... <i class='fa-solid fa-rotate fa-spin'></i>";
            isCapturing = true;

            startTimer();
        })
        .catch(error => {
            showCaptureModal("Error Starting Capture!", "error");
        });
}

function stopCapture() {
    fetch('http://127.0.0.1:5000/stop_capture', { method: 'POST', credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            showCaptureModal("Capture Stopped!", "error");
            const startBtn = document.getElementById("startCaptureBtn");
            startBtn.classList.remove("active-btn");
            startBtn.innerHTML = "<i class='fa-solid fa-play'></i> Start Capture";
            isCapturing = false;

            stopTimer();

            if (autoUpdate) {
                toggleAutoUpdate();
            }
        })
        .catch(error => {
            showCaptureModal("Error Stopping Capture!", "error");
        });
    setTimeout(fetchPackets, 1000);
}

function clearPackets() {
    fetch('http://127.0.0.1:5000/clear_packets', { method: 'POST', credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            showCaptureModal("Packets have been cleared.", "success");
            packets = [];
            lastPacketTimestamp = null;
            updateUI([]);
            updateRecentPacketsTable([]);
            checkNetworkAnomalies([]);
            updateSystemStats([]);

            resetTimer();

            document.getElementById("packetCount").textContent = "0";
            const anomalySection = document.getElementById("anomalySection");
            if (anomalySection) {
                anomalySection.innerHTML = `<div class="no-anomalies"><i class="fas fa-check-circle"></i><p>No network anomalies detected</p></div>`;
            }
        })
        .catch(error => {
            showCaptureModal("Failed to clear packets.", "error");
        });
}


function fetchPackets() {
    fetch(`http://127.0.0.1:5000/get_packets?since=${lastPacketTimestamp || 0}`, { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(newPackets => {
            if (newPackets.length > 0) {
                let combinedPackets = packets.concat(newPackets);
                if (combinedPackets.length > MAX_FRONTEND_PACKETS) {
                    packets = combinedPackets.slice(-MAX_FRONTEND_PACKETS);
                } else {
                    packets = combinedPackets;
                }

                document.getElementById("packetCount").textContent = packets.length;

                updateUI(packets);
                updateRecentPacketsTable(packets.slice(-5));
                checkNetworkAnomalies(packets.slice(-1000));
                updateSystemStats(packets);

                lastPacketTimestamp = newPackets[newPackets.length - 1].timestamp;
            }
        })
        .catch(error => console.error('Error fetching packets:', error));
}



function updateUI(allPackets) {
    const protocolFilterValue = document.getElementById('protocolFilter').value;
    const sectionsContainer = document.getElementById('packetSections');
    sectionsContainer.innerHTML = '';

    let protocolGroups = {};
    let uniqueProtocols = new Set();
    allPackets.forEach(packet => {
        let protocol = packet.protocol || "Unknown";
        uniqueProtocols.add(protocol);
        if (!protocolGroups[protocol]) protocolGroups[protocol] = [];
        protocolGroups[protocol].push(packet);
    });

    const protocolFilterDropdown = document.getElementById('protocolFilter');
    protocolFilterDropdown.innerHTML = '<option value="">All Protocols</option>';
    [...uniqueProtocols].sort().forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        protocolFilterDropdown.appendChild(option);
    });
    protocolFilterDropdown.value = protocolFilterValue;

    const packetsToDisplay = protocolFilterValue ? (protocolGroups[protocolFilterValue] || []) : allPackets;
    const protocolKey = protocolFilterValue || 'all';
    currentPageByProtocol[protocolKey] = currentPageByProtocol[protocolKey] || 1;
    let currentPage = currentPageByProtocol[protocolKey];

    const totalPackets = packetsToDisplay.length;
    const totalPages = Math.ceil(totalPackets / PACKETS_PER_PAGE) || 1;
    if (currentPage > totalPages) {
        currentPage = totalPages;
        currentPageByProtocol[protocolKey] = currentPage;
    }
    const startIndex = (currentPage - 1) * PACKETS_PER_PAGE;
    const paginatedPackets = packetsToDisplay.slice(startIndex, startIndex + PACKETS_PER_PAGE);

    const section = document.createElement('div');
    section.className = 'protocol-section';
    const header = document.createElement('div');
    header.className = 'protocol-header';
    header.textContent = `${protocolKey.toUpperCase()} Packets (${totalPackets} total)`;
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-wrapper';
    const table = document.createElement('table');
    table.className = 'packet-table';

    let isLogged = localStorage.getItem('isLoggedIn') === "true";
    if (isLogged) {
        table.innerHTML = `
            <thead class="user-header">
                <tr>
                    <th>#</th><th>Source</th><th>Destination</th><th>Src Location</th>
                    <th>Dst Location</th><th>Protocol</th><th>Summary</th><th>Size</th><th>Time</th>
                </tr>
            </thead>
        `;
        const tableBody = document.createElement('tbody');
        paginatedPackets.forEach((packet, index) => {
            const row = tableBody.insertRow();
            row.onclick = () => showPacketDetails(packet);

            const srcLocation = packet.is_mac ? "MAC Address" : (packet.src_geo && packet.src_geo.city ? `${packet.src_geo.city}, ${packet.src_geo.country}` : (packet.src_geo && packet.src_geo.type === 'private' ? 'Local Network' : 'Unknown'));
            const dstLocation = packet.is_mac ? "MAC Address" : (packet.dst_geo && packet.dst_geo.city ? `${packet.dst_geo.city}, ${packet.dst_geo.country}` : (packet.dst_geo && packet.dst_geo.type === 'private' ? 'Local Network' : 'Unknown'));

            row.innerHTML = `
                <td>${startIndex + index + 1}</td>
                <td>${packet.src || "N/A"}</td>
                <td>${packet.dst || "N/A"}</td>
                <td>${srcLocation}</td>
                <td>${dstLocation}</td>
                <td>${packet.protocol}</td>
                <td><div class="summary-cell">${packet.summary || "N/A"}</div></td>
                <td>${formatBytes(packet.size || 0)}</td>
                <td>${formatDate(packet.timestamp)}</td>
            `;
        });
        table.appendChild(tableBody);

    } else {
        if (!isLoggedIn) {
            const ctaBar = document.createElement('div');
            ctaBar.className = 'guest-cta-bar';

            ctaBar.innerHTML = `
            <p>
                <i class="fa-solid fa-lock icon"></i>
                Geo-location, summaries, and more are hidden. Login for full details.
            </p>
            <button class="login-prompt-btn">Login to Unlock</button>
        `;

            ctaBar.querySelector('.login-prompt-btn').addEventListener('click', () => {
                document.getElementById('userModal').style.display = 'flex';
            });
            sectionsContainer.appendChild(ctaBar);
        }

        table.innerHTML = `
            <thead class="guest-header">
                <tr>
                    <th>#</th>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Protocol</th>
                    <th>Size</th>
                    <th>Time</th>
                </tr>
            </thead>
        `;
        const tableBody = document.createElement('tbody');
        paginatedPackets.forEach((packet, index) => {
            const row = tableBody.insertRow();
            row.onclick = () => showPacketDetails(packet);

            row.innerHTML = `
                <td>${startIndex + index + 1}</td>
                <td>${packet.src || "N/A"}</td>
                <td>${packet.dst || "N/A"}</td>
                <td>${packet.protocol || "N/A"}</td>
                <td>${formatBytes(packet.size || 0)}</td>
                <td>${formatDate(packet.timestamp)}</td>
            `;
        });
        table.appendChild(tableBody);
    }

    tableWrapper.appendChild(table);
    section.appendChild(header);
    section.appendChild(tableWrapper);

    if (totalPages > 1) {
        const paginationControls = document.createElement('div');
        paginationControls.className = 'pagination-controls';
        const prevButton = document.createElement('button');
        prevButton.className = 'page-btn';
        prevButton.innerHTML = '<i class="fa-solid fa-chevron-left"></i> Prev';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => { currentPageByProtocol[protocolKey]--; updateUI(allPackets); };
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        const nextButton = document.createElement('button');
        nextButton.className = 'page-btn';
        nextButton.innerHTML = 'Next <i class="fa-solid fa-chevron-right"></i>';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = () => { currentPageByProtocol[protocolKey]++; updateUI(allPackets); };
        paginationControls.appendChild(prevButton);
        paginationControls.appendChild(pageInfo);
        paginationControls.appendChild(nextButton);
        section.appendChild(paginationControls);
    }

    sectionsContainer.appendChild(section);
    updateChart(protocolGroups);
}

function updateRecentPacketsTable(allPackets) {
    const tableBody = document.getElementById("recentPacketsTable").getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    const packetsToShow = allPackets.slice(-100).reverse();

    packetsToShow.forEach((packet, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${allPackets.length - index}</td>
            <td>${packet.src || "N/A"}</td>
            <td>${packet.dst || "N/A"}</td>
            <td>${packet.protocol || "N/A"}</td>
            <td>${formatBytes(packet.size || 0)}</td>
            <td>${formatDate(packet.timestamp)}</td>
        `;
    });
}

function updateSystemStats(allPackets) {
    const totalData = allPackets.reduce((acc, p) => acc + (p.size || 0), 0);
    const avgSize = allPackets.length > 0 ? totalData / allPackets.length : 0;

    const firstTimestamp = allPackets.length > 0 ? allPackets[0].timestamp : 0;
    const lastTimestamp = allPackets.length > 0 ? allPackets[allPackets.length - 1].timestamp : 0;
    const duration = lastTimestamp - firstTimestamp;
    const dataRate = duration > 0 ? totalData / duration : 0;

    document.getElementById('totalData').textContent = formatBytes(totalData);
    document.getElementById('avgSize').textContent = formatBytes(avgSize);
    document.getElementById('dataRate').textContent = `${formatBytes(dataRate)}/s`;
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDate(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString();
}

function searchPackets() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const sections = document.querySelectorAll(".protocol-section");
    const searchCountDiv = document.getElementById("searchCount");
    let matchCount = 0;

    if (input.trim() === "") {
        sections.forEach(section => {
            section.style.display = "";
            const rows = section.querySelectorAll("tbody tr");
            rows.forEach(row => {
                row.style.display = "";
                row.querySelectorAll("td").forEach(cell => {
                    cell.innerHTML = cell.textContent;
                });
            });
        });
        searchCountDiv.classList.remove("show", "error", "success");
        return;
    }

    sections.forEach(section => {
        const rows = section.querySelectorAll("tbody tr");
        let sectionVisible = false;
        rows.forEach(row => {
            let matchFound = false;
            const cells = row.querySelectorAll("td");
            cells.forEach(cell => {
                cell.innerHTML = cell.textContent;
                if (cell.textContent.toLowerCase().includes(input)) {
                    matchFound = true;
                    cell.innerHTML = cell.textContent.replace(new RegExp(input, "ig"), `<span class="highlight">$&</span>`);
                }
            });

            if (matchFound) {
                sectionVisible = true;
                matchCount++;
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
        section.style.display = sectionVisible ? "" : "none";
    });

    if (matchCount > 0) {
        searchCountDiv.textContent = `${matchCount} matches`;
        searchCountDiv.className = 'show success';
    } else {
        searchCountDiv.textContent = "No matches";
        searchCountDiv.className = 'show error';
    }
}

function toggleAutoUpdate() {
    autoUpdate = !autoUpdate;
    const autoUpdateBtn = document.getElementById("autoUpdateBtn");
    if (autoUpdate && isCapturing) {
        autoUpdateBtn.classList.add("active-btn");
        autoUpdateBtn.querySelector('i').classList.add('fa-spin');
        autoUpdateInterval = setInterval(fetchPackets, 3000);
    } else {
        autoUpdateBtn.classList.remove("active-btn");
        autoUpdateBtn.querySelector('i').classList.remove('fa-spin');
        clearInterval(autoUpdateInterval);
    }
}


function exportPackets(format) {
    let dataStr;
    let filename = `capture_${new Date().toISOString()}.${format}`;

    if (format === 'json') {
        dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(packets, null, 2));
    } else if (format === 'csv') {
        const headers = "Timestamp,SourceIP,DestinationIP,SrcLocation,DstLocation,Protocol,Size,Summary\n";
        const csvContent = packets.map(p => {
            const srcLoc = p.is_mac ? "N/A" : `${p.src_geo?.city || ''}, ${p.src_geo?.country || ''}`;
            const dstLoc = p.is_mac ? "N/A" : `${p.dst_geo?.city || ''}, ${p.dst_geo?.country || ''}`;
            return [
                new Date(p.timestamp * 1000).toISOString(),
                p.src, p.dst, `"${srcLoc}"`, `"${dstLoc}"`,
                p.protocol, p.size, `"${p.summary.replace(/"/g, '""')}"`
            ].join(',');
        }).join('\n');
        dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + csvContent);
    }

    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported as ${format.toUpperCase()}`, 'info');
}

function downloadPcap() {
    fetch('http://127.0.0.1:5000/save_capture', { method: 'POST', credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.file) {
                window.location.href = 'http://127.0.0.1:5000/download_pcap';
            } else {
                showToast(data.status, 'warning');
            }
        });
}

function updateChart(protocolGroups) {
    const ctxLine = document.getElementById('trafficLineChart').getContext('2d');
    const ctxPie = document.getElementById('trafficPieChart').getContext('2d');

    const style = getComputedStyle(document.body);
    const tickColor = style.getPropertyValue('--chart-tick-color').trim();
    const gridColor = style.getPropertyValue('--chart-grid-color').trim();
    const chartColors = [
        style.getPropertyValue('--accent-primary').trim(),
        style.getPropertyValue('--success').trim(),
        style.getPropertyValue('--warning').trim(),
        style.getPropertyValue('--danger').trim(),
        style.getPropertyValue('--info').trim(),
    ];

    const labels = Object.keys(protocolGroups).sort((a, b) => protocolGroups[b].length - protocolGroups[a].length).slice(0, 10);
    const data = labels.map(label => protocolGroups[label].length);

    if (trafficLineChart) trafficLineChart.destroy();
    if (trafficPieChart) trafficPieChart.destroy();

    trafficLineChart = new Chart(ctxLine, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ data, backgroundColor: chartColors, barThickness: 25 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: tickColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: tickColor }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    trafficPieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels,
            datasets: [{ data, backgroundColor: chartColors, borderColor: style.getPropertyValue('--bg-secondary').trim(), borderWidth: 1 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: tickColor }
                }
            }
        }
    });

    toggleChartDisplay();
}

function toggleChartType() {
    toggleContainer.classList.toggle("active");
    currentChartType = currentChartType === 'bar' ? 'pie' : 'bar';
    toggleChartDisplay();
}

function toggleChartDisplay() {
    const lineChart = document.getElementById('lineChartContainer');
    const pieChart = document.getElementById('pieChartContainer');
    if (currentChartType === 'bar') {
        lineChart.style.display = 'block';
        pieChart.style.display = 'none';
    } else {
        lineChart.style.display = 'none';
        pieChart.style.display = 'block';
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const icon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
    themeToggleBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;

    if (trafficLineChart) trafficLineChart.destroy();
    if (trafficPieChart) trafficPieChart.destroy();
    trafficLineChart = null;
    trafficPieChart = null;
    if (packets.length > 0) {
        let protocolGroups = {};
        packets.forEach(packet => {
            let protocol = packet.protocol || "Unknown";
            if (!protocolGroups[protocol]) protocolGroups[protocol] = [];
            protocolGroups[protocol].push(packet);
        });
        updateChart(protocolGroups);
    }
}


function showCaptureModal(message, type) {
    const modal = document.getElementById("captureModal");
    const messageElement = document.getElementById("captureMessage");
    const icon = type === "success" ? '<i class="fa-solid fa-check-circle"></i>' : '<i class="fa-solid fa-times-circle"></i>';
    messageElement.innerHTML = `${icon} ${message}`;
    modal.className = `startmodal show ${type}`;
    setTimeout(() => modal.classList.remove("show"), 2500);
}

function showToast(message, type = 'info', duration = 3000) {
    const icons = { critical: 'fa-radiation', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const remToast = {
        'info': 3000,
        'warning': 4000,
        'danger': 5000
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}"></i> ${message} <button class="toast-close">×</button>`;

    document.getElementById('toastContainer').appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    const removeToast = () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').onclick = removeToast;
    setTimeout(removeToast, remToast[type] || duration);
}


function checkLoginStatus() {
    const username = localStorage.getItem('username');
    if (username) {
        updateUIAfterLogin(username);
    } else {
        updateUIAfterLogout();
    }
}

function handleLogin(e) {
    e.preventDefault();
    let loginErrorEl = document.getElementById("loginError");
    loginErrorEl.textContent = '';
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
    })
        .then(res => res.json())
        .then(data => {
            if (data.username) {
                localStorage.setItem('username', data.username);
                localStorage.setItem('isLoggedIn', "true");
                updateUIAfterLogin(data.username);
                userModal.style.display = 'none';
                isLoggedIn = true;
                updateUI(packets);
                showToast(`Welcome back, ${data.username.toUpperCase()}!`, 'info');

                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.cursor = "pointer";
                    btn.title = "";
                });
            } else {
                loginErrorEl.textContent = data.error || 'Login failed.';
            }
        })
        .catch(err => {
            loginErrorEl.textContent = 'An error occurred.';
        });
}

function handleRegister(e) {
    e.preventDefault();
    const registerErrorEl = document.getElementById("registerError");
    registerErrorEl.textContent = '';
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include'
    })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                showToast(data.message, 'info');
                switchAuthForm('login');
                document.getElementById('loginEmail').value = email;
            } else {
                registerErrorEl.textContent = data.error || 'Registration failed.';
            }
        })
        .catch(err => {
            registerErrorEl.textContent = 'An error occurred.';
        });
}

function logout() {
    fetch('http://127.0.0.1:5000/logout', { method: 'POST', credentials: 'include' })
        .then(() => {
            localStorage.removeItem('username');
            localStorage.removeItem('isLoggedIn');
            isLoggedIn = false;
            updateUI(packets);
            updateUIAfterLogout();
            showToast('You have been logged out.', 'info');
        });
}

function updateUIAfterLogin(username) {
    userDisplayName.textContent = username;
    authBtn.textContent = 'Logout';
}

function updateUIAfterLogout() {
    userDisplayName.textContent = 'Guest';
    authBtn.textContent = 'Login';
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add("disabled-btn");
        btn.title = "Login to download packets";
    });
}

function switchAuthForm(form) {

    const loginErrorEl = document.getElementById("loginError");
    const registerErrorEl = document.getElementById("registerError");

    if (form === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        showLoginBtn.classList.remove('active');
        showRegisterBtn.classList.add('active');
    }
    loginErrorEl.textContent = '';
    registerErrorEl.textContent = '';
}


const ANOMALY_CONFIG = {
    PACKET_RATE: { NORMAL: 50, HIGH: 100, CRITICAL: 200 },
    PERCENTAGE: { NORMAL: 10, HIGH: 30, CRITICAL: 50 },
    SIZE: { JUMBO: 1500, LARGE_TRANSFER: 5 * 1024 * 1024 },
    PORT_SCAN: { UNIQUE_PORTS: 5 },
    DDOS: { SOURCE_IPS: 50, PACKET_SIMILARITY: 0.8 },
};
let lastCheckTime = Date.now();
let packetHistory = [];

function checkNetworkAnomalies(allPackets) {
    const now = Date.now();
    const elapsedTime = Math.max((now - lastCheckTime) / 1000, 1);
    lastCheckTime = now;

    packetHistory = allPackets.filter(p => p.timestamp > (now / 1000) - 60);
    const totalPackets = allPackets.length;
    if (totalPackets === 0) {
        updateAnomalyTable([]);
        return;
    }

    const analysis = {
        ipStats: {}, protocolStats: {}, portStats: {},
        sizeStats: { total: 0, average: 0, sizes: [], jumboPackets: 0, stdDev: 0 },
        timeStats: { start: allPackets[0].timestamp, end: allPackets[totalPackets - 1].timestamp, duration: 0, rate: 0, totalPackets: totalPackets },
        anomalies: []
    };

    analysis.timeStats.duration = analysis.timeStats.end - analysis.timeStats.start;
    analysis.timeStats.rate = analysis.timeStats.duration > 0 ? totalPackets / analysis.timeStats.duration : 0;

    allPackets.forEach(packet => {
        const srcIP = packet.src || "Unknown";
        analysis.ipStats[srcIP] = analysis.ipStats[srcIP] || { count: 0, size: 0, ports: new Set(), protocols: new Set() };
        analysis.ipStats[srcIP].count++;
        analysis.ipStats[srcIP].size += packet.size || 0;
        if (packet.sport) analysis.ipStats[srcIP].ports.add(packet.sport);
        if (packet.protocol) analysis.ipStats[srcIP].protocols.add(packet.protocol);

        const protocol = packet.protocol || "Unknown";
        analysis.protocolStats[protocol] = (analysis.protocolStats[protocol] || 0) + 1;

        const pktSize = packet.size || 0;
        analysis.sizeStats.total += pktSize;
        analysis.sizeStats.sizes.push(pktSize);
        if (pktSize > ANOMALY_CONFIG.SIZE.JUMBO) analysis.sizeStats.jumboPackets++;
    });

    analysis.sizeStats.average = totalPackets > 0 ? analysis.sizeStats.total / totalPackets : 0;

    // Detection logic calls
    detectIpAnomalies(analysis, elapsedTime, totalPackets);
    detectProtocolAnomalies(analysis, totalPackets);
    detectSizeAnomalies(analysis, totalPackets);
    detectPortScans(analysis);
    detectDdosAttacks(analysis);
    detectSynFloods(packetHistory, analysis);

    analysis.anomalies.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    analysis.anomalies.forEach(anomaly => {
        const toastType = anomaly.severity === 'critical' ? 'critical' : anomaly.severity === 'high' ? 'warning' : 'info';
        showToast(`${anomaly.type}: ${anomaly.source}`, toastType, 5000);
    });

    updateAnomalyTable(analysis.anomalies);
}

function detectIpAnomalies(analysis, elapsedTime, totalPackets) {
    for (const [ip, stats] of Object.entries(analysis.ipStats)) {
        const rate = stats.count / elapsedTime;
        if (rate > ANOMALY_CONFIG.PACKET_RATE.NORMAL) {
            analysis.anomalies.push({ type: 'High Packet Rate', source: ip, value: `${rate.toFixed(2)} pps`, severity: rate > ANOMALY_CONFIG.PACKET_RATE.CRITICAL ? 'critical' : 'high', details: `${stats.count} packets` });
        }
        if (stats.size > ANOMALY_CONFIG.SIZE.LARGE_TRANSFER) {
            analysis.anomalies.push({ type: 'Large Data Transfer', source: ip, value: formatBytes(stats.size), severity: 'high', details: `Avg size ${formatBytes(stats.size / stats.count)}` });
        }
    }
}
function detectProtocolAnomalies(analysis, totalPackets) {
    for (const [protocol, count] of Object.entries(analysis.protocolStats)) {
        const percentage = (count / totalPackets) * 100;
        if (protocol === 'ICMP' && percentage > ANOMALY_CONFIG.PERCENTAGE.NORMAL) {
            analysis.anomalies.push({ type: 'Excessive ICMP', source: protocol, value: `${percentage.toFixed(2)}%`, severity: 'medium', details: `${count} packets` });
        }
    }
}
function detectSizeAnomalies(analysis, totalPackets) {
    if (analysis.sizeStats.jumboPackets > 0) {
        const jumboPercentage = (analysis.sizeStats.jumboPackets / totalPackets) * 100;
        if (jumboPercentage > 5) {
            analysis.anomalies.push({ type: 'Excessive Jumbo Packets', source: 'Network', value: `${jumboPercentage.toFixed(2)}%`, severity: 'medium', details: `${analysis.sizeStats.jumboPackets} jumbo packets` });
        }
    }
}
function detectPortScans(analysis) {
    for (const [ip, stats] of Object.entries(analysis.ipStats)) {
        if (stats.ports.size > ANOMALY_CONFIG.PORT_SCAN.UNIQUE_PORTS) {
            analysis.anomalies.push({ type: 'Possible Port Scan', source: ip, value: `${stats.ports.size} ports`, severity: 'high', details: `Ports: ${[...stats.ports].slice(0, 3).join(', ')}...` });
        }
    }
}
function detectDdosAttacks(analysis) {
    const uniqueSources = Object.keys(analysis.ipStats).length;
    if (uniqueSources > ANOMALY_CONFIG.DDOS.SOURCE_IPS) {
        analysis.anomalies.push({ type: 'Possible DDoS', source: `${uniqueSources} IPs`, value: `High source count`, severity: 'critical', details: `High number of unique source IPs detected.` });
    }
}
function detectSynFloods(packetHistory, analysis) {
    const synPackets = packetHistory.filter(p => p.protocol === 'TCP' && p.summary?.includes('SYN') && !p.summary?.includes('ACK'));
    const synRate = synPackets.length / 60;
    if (synRate > ANOMALY_CONFIG.PACKET_RATE.HIGH / 2) {
        analysis.anomalies.push({ type: 'Possible SYN Flood', source: 'TCP', value: `${synRate.toFixed(2)} SYNs/sec`, severity: 'critical', details: `${synPackets.length} un-acked SYNs in 1 min` });
    }
}

function updateAnomalyTable(anomalies) {
    const anomalySection = document.getElementById("anomalySection");
    if (!anomalies || anomalies.length === 0) {
        anomalySection.innerHTML = `<div class="no-anomalies"><i class="fas fa-check-circle"></i><p>No network anomalies detected</p><small>System is looking clean.</small></div>`;
        return;
    }
    const severityIcons = { critical: 'fa-radiation', high: 'fa-exclamation-triangle', medium: 'fa-exclamation-circle', low: 'fa-info-circle' };
    let tableHTML = `
        <div class="anomaly-header">
            <h3><i class="fas fa-exclamation-triangle d-flex f-align-center"></i> Detected Anomalies</h3>
            <small>${anomalies.length} issues found</small>
        </div>
        <div class="anomaly-table-container">
            <table class="anomaly-table">
                <thead><tr><th>Type</th><th>Source</th><th>Value</th><th>Severity</th><th>Details</th></tr></thead>
                <tbody>
                    ${anomalies.map(anomaly => `
                        <tr class="severity-${anomaly.severity}">
                            <td><i class="fas ${severityIcons[anomaly.severity] || 'fa-question-circle'}"></i> ${anomaly.type}</td>
                            <td>${anomaly.source}</td>
                            <td>${anomaly.value}</td>
                            <td><span class="badge badge-${anomaly.severity === 'critical' ? 'danger' : anomaly.severity === 'high' ? 'warning' : 'info'}">${anomaly.severity}</span></td>
                            <td>${anomaly.details}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    anomalySection.innerHTML = tableHTML;
}

function testAllAnomalies() {
    isCapturing = true;
    const testTime = Date.now() / 1000;
    const testPackets = [
        ...Array(150).fill().map((_, i) => ({ src: "192.168.1.100", dst: "192.168.1.1", protocol: "TCP", size: 60, timestamp: testTime - i * 0.01, sport: 12345, summary: "SYN" })),
        ...Array(5).fill().map((_, i) => ({ src: "10.0.0.5", dst: "10.0.0.1", protocol: "UDP", size: 1024 * 1024, timestamp: testTime - 2, summary: "Data" })),
        ...Array.from({ length: 6 }, (_, i) => ({ src: "172.16.0.99", dst: "172.16.0.1", protocol: "TCP", sport: 30000 + i, size: 60, timestamp: testTime - 1.5, summary: "Scan" })),
        ...Array(100).fill().map(() => ({ src: "192.168.1.2", dst: "192.168.1.1", protocol: "ICMP", size: 84, timestamp: testTime - 1, summary: "Echo" })),
        ...Array(20).fill().map(() => ({ src: "10.0.0.10", dst: "10.0.0.1", protocol: "UDP", size: 1600, timestamp: testTime - 0.5, summary: "Jumbo" })),
        ...Array.from({ length: 51 }, (_, i) => `10.1.1.${i}`).map(ip => ({ src: ip, dst: "192.168.1.1", protocol: "UDP", size: 1000, timestamp: testTime - 0.1, summary: "DDoS" })),
    ];
    packets = testPackets;
    lastPacketTimestamp = testTime;

    document.getElementById("packetCount").textContent = packets.length;
    updateUI(packets);
    checkNetworkAnomalies(packets);
    updateSystemStats(packets);
    isCapturing = false;
}
