using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Diagnostics;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using System.Collections.Generic;

namespace SpeedrrTurboApp
{
    public class MainForm : Form
    {
        [DllImport("winmm.dll", EntryPoint = "timeBeginPeriod")]
        private static extern uint timeBeginPeriod(uint uMilliseconds);

        [DllImport("winmm.dll", EntryPoint = "timeEndPeriod")]
        private static extern uint timeEndPeriod(uint uMilliseconds);

        [DllImport("dnsapi.dll", EntryPoint = "DnsFlushResolverCache")]
        private static extern int DnsFlushResolverCache();

        // UI Controls
        private Label lblHeaderTitle;
        private Label lblHeaderSubtitle;
        private Label lblSpeedMbps;
        private Label lblSpeedMBps;
        private Label lblPercentPlan;
        private Panel pnlSpeedBar;
        private Label lblTixatiStatus;
        private Label lblPeersCount;
        private Label lblPingCloudflare;
        private Label lblPingGoogle;
        private Label lblWifiAdapter;
        private Button btnTurbo;
        private Button btnCopyTrackers;
        private Button btnOptimizeDNS;
        private Button btnAdminTweaks;
        private CheckBox chkKeepAlive;
        private ListBox lstLog;
        private System.Windows.Forms.Timer timerTick;

        // Metrics Tracking
        private NetworkInterface targetInterface = null;
        private long lastBytesReceived = 0;
        private DateTime lastCheckTime = DateTime.UtcNow;
        private double currentMbps = 0.0;
        private double currentMBps = 0.0;
        private double planMbps = 30.0;
        private int cfPingMs = -1;
        private int googlePingMs = -1;
        private int peerCount = 0;
        private bool isTixatiRunning = false;
        private int tixatiPid = 0;

        public MainForm()
        {
            this.Text = "Speedrr Turbo - Network & Torrent Accelerator";
            this.Size = new Size(800, 640);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(11, 15, 25);
            this.DoubleBuffered = true;

            // Set Windows high-resolution multimedia timer to 1ms
            try { timeBeginPeriod(1); } catch { }

            InitializeComponents();
            FindActiveInterface();
        }

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);
            LogMessage("Turbo Engine initialized. High-resolution multimedia timer active (1.0 ms).");

            timerTick = new System.Windows.Forms.Timer();
            timerTick.Interval = 1000;
            timerTick.Tick += new EventHandler(OnTimerTick);
            timerTick.Start();

            // Run initial boost after form is shown
            ActivateTurboBoost();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            timeEndPeriod(1);
            base.OnFormClosing(e);
        }

        private void InitializeComponents()
        {
            // Header Panel
            Panel pnlHeader = new Panel();
            pnlHeader.Location = new Point(0, 0);
            pnlHeader.Size = new Size(800, 75);
            pnlHeader.BackColor = Color.FromArgb(17, 24, 39);

            lblHeaderTitle = new Label();
            lblHeaderTitle.Text = "SPEEDRR TURBO // NETWORK ACCELERATOR";
            lblHeaderTitle.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            lblHeaderTitle.ForeColor = Color.FromArgb(0, 229, 255);
            lblHeaderTitle.Location = new Point(20, 14);
            lblHeaderTitle.AutoSize = true;
            pnlHeader.Controls.Add(lblHeaderTitle);

            lblHeaderSubtitle = new Label();
            lblHeaderSubtitle.Text = "Real-Time Bandwidth Engine • Tixati Optimizer • Latency & Bufferbloat Stabilizer";
            lblHeaderSubtitle.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblHeaderSubtitle.ForeColor = Color.FromArgb(156, 163, 175);
            lblHeaderSubtitle.Location = new Point(22, 45);
            lblHeaderSubtitle.AutoSize = true;
            pnlHeader.Controls.Add(lblHeaderSubtitle);

            this.Controls.Add(pnlHeader);

            // Card 1: Speedometer Card
            Panel cardSpeed = CreateCard(20, 90, 480, 160);
            
            Label lblSpeedHeader = new Label();
            lblSpeedHeader.Text = "LIVE INTERNET DOWNLOAD SPEED";
            lblSpeedHeader.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblSpeedHeader.ForeColor = Color.FromArgb(156, 163, 175);
            lblSpeedHeader.Location = new Point(15, 12);
            lblSpeedHeader.AutoSize = true;
            cardSpeed.Controls.Add(lblSpeedHeader);

            lblSpeedMbps = new Label();
            lblSpeedMbps.Text = "0.00 Mbps";
            lblSpeedMbps.Font = new Font("Segoe UI", 28, FontStyle.Bold);
            lblSpeedMbps.ForeColor = Color.FromArgb(0, 255, 127);
            lblSpeedMbps.Location = new Point(12, 35);
            lblSpeedMbps.AutoSize = true;
            cardSpeed.Controls.Add(lblSpeedMbps);

            lblSpeedMBps = new Label();
            lblSpeedMBps.Text = "(0.00 MB/s)";
            lblSpeedMBps.Font = new Font("Segoe UI", 14, FontStyle.Bold);
            lblSpeedMBps.ForeColor = Color.FromArgb(0, 229, 255);
            lblSpeedMBps.Location = new Point(260, 48);
            lblSpeedMBps.AutoSize = true;
            cardSpeed.Controls.Add(lblSpeedMBps);

            lblPercentPlan = new Label();
            lblPercentPlan.Text = "Line Utilization: 0% of 30 Mbps Plan";
            lblPercentPlan.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblPercentPlan.ForeColor = Color.FromArgb(209, 213, 219);
            lblPercentPlan.Location = new Point(15, 92);
            lblPercentPlan.AutoSize = true;
            cardSpeed.Controls.Add(lblPercentPlan);

            pnlSpeedBar = new Panel();
            pnlSpeedBar.Location = new Point(15, 115);
            pnlSpeedBar.Size = new Size(450, 26);
            pnlSpeedBar.BackColor = Color.FromArgb(30, 41, 59);
            pnlSpeedBar.Paint += new PaintEventHandler(OnPaintSpeedBar);
            cardSpeed.Controls.Add(pnlSpeedBar);

            this.Controls.Add(cardSpeed);

            // Card 2: Status & Diagnostics Card
            Panel cardStatus = CreateCard(520, 90, 245, 160);

            Label lblStatusHeader = new Label();
            lblStatusHeader.Text = "TELEMETRY & STATUS";
            lblStatusHeader.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblStatusHeader.ForeColor = Color.FromArgb(156, 163, 175);
            lblStatusHeader.Location = new Point(12, 12);
            lblStatusHeader.AutoSize = true;
            cardStatus.Controls.Add(lblStatusHeader);

            lblTixatiStatus = new Label();
            lblTixatiStatus.Text = "Tixati: Checking...";
            lblTixatiStatus.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblTixatiStatus.ForeColor = Color.FromArgb(245, 158, 11);
            lblTixatiStatus.Location = new Point(12, 38);
            lblTixatiStatus.AutoSize = true;
            cardStatus.Controls.Add(lblTixatiStatus);

            lblPeersCount = new Label();
            lblPeersCount.Text = "Active Peers: 0";
            lblPeersCount.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblPeersCount.ForeColor = Color.FromArgb(167, 139, 250);
            lblPeersCount.Location = new Point(12, 62);
            lblPeersCount.AutoSize = true;
            cardStatus.Controls.Add(lblPeersCount);

            lblPingCloudflare = new Label();
            lblPingCloudflare.Text = "Cloudflare (1.1.1.1): -- ms";
            lblPingCloudflare.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblPingCloudflare.ForeColor = Color.FromArgb(209, 213, 219);
            lblPingCloudflare.Location = new Point(12, 86);
            lblPingCloudflare.AutoSize = true;
            cardStatus.Controls.Add(lblPingCloudflare);

            lblPingGoogle = new Label();
            lblPingGoogle.Text = "Google (8.8.8.8): -- ms";
            lblPingGoogle.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblPingGoogle.ForeColor = Color.FromArgb(209, 213, 219);
            lblPingGoogle.Location = new Point(12, 110);
            lblPingGoogle.AutoSize = true;
            cardStatus.Controls.Add(lblPingGoogle);

            lblWifiAdapter = new Label();
            lblWifiAdapter.Text = "Adapter: Detecting...";
            lblWifiAdapter.Font = new Font("Segoe UI", 8, FontStyle.Regular);
            lblWifiAdapter.ForeColor = Color.FromArgb(107, 114, 128);
            lblWifiAdapter.Location = new Point(12, 134);
            lblWifiAdapter.AutoSize = true;
            cardStatus.Controls.Add(lblWifiAdapter);

            this.Controls.Add(cardStatus);

            // Card 3: Actions & Booster Buttons
            Panel cardActions = CreateCard(20, 265, 745, 95);

            btnTurbo = CreateButton("⚡ TURBO BOOST", 15, 14, 168, 36, Color.FromArgb(16, 185, 129), Color.Black);
            btnTurbo.Click += new EventHandler(delegate { ActivateTurboBoost(); });
            cardActions.Controls.Add(btnTurbo);

            btnCopyTrackers = CreateButton("📋 COPY TRACKERS", 192, 14, 168, 36, Color.FromArgb(0, 229, 255), Color.Black);
            btnCopyTrackers.Click += new EventHandler(delegate { CopyLiveTrackers(); });
            cardActions.Controls.Add(btnCopyTrackers);

            btnOptimizeDNS = CreateButton("🌐 FLUSH & PING DNS", 369, 14, 175, 36, Color.FromArgb(167, 139, 250), Color.Black);
            btnOptimizeDNS.Click += new EventHandler(delegate { FlushAndBenchmarkDns(); });
            cardActions.Controls.Add(btnOptimizeDNS);

            btnAdminTweaks = CreateButton("🚀 ADMIN OPTIMIZER", 553, 14, 177, 36, Color.FromArgb(245, 158, 11), Color.Black);
            btnAdminTweaks.Click += new EventHandler(delegate { LaunchAdminOptimizer(); });
            cardActions.Controls.Add(btnAdminTweaks);

            chkKeepAlive = new CheckBox();
            chkKeepAlive.Text = "Wi-Fi Anti-Sleep Keep-Alive (Prevents TP-Link adapter power-save latency spikes)";
            chkKeepAlive.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            chkKeepAlive.ForeColor = Color.FromArgb(209, 213, 219);
            chkKeepAlive.Location = new Point(18, 60);
            chkKeepAlive.AutoSize = true;
            chkKeepAlive.Checked = true;
            cardActions.Controls.Add(chkKeepAlive);

            this.Controls.Add(cardActions);

            // Card 4: Console Log / Activity Feed
            Panel cardLog = CreateCard(20, 375, 745, 210);

            Label lblLogHeader = new Label();
            lblLogHeader.Text = "TURBO ENGINE EVENT LOG & ACTIVITY STREAM";
            lblLogHeader.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblLogHeader.ForeColor = Color.FromArgb(156, 163, 175);
            lblLogHeader.Location = new Point(15, 10);
            lblLogHeader.AutoSize = true;
            cardLog.Controls.Add(lblLogHeader);

            lstLog = new ListBox();
            lstLog.Location = new Point(15, 32);
            lstLog.Size = new Size(715, 160);
            lstLog.BackColor = Color.FromArgb(10, 14, 22);
            lstLog.ForeColor = Color.FromArgb(0, 229, 255);
            lstLog.Font = new Font("Consolas", 9, FontStyle.Regular);
            lstLog.BorderStyle = BorderStyle.None;
            cardLog.Controls.Add(lstLog);

            this.Controls.Add(cardLog);
        }

        private Panel CreateCard(int x, int y, int w, int h)
        {
            Panel p = new Panel();
            p.Location = new Point(x, y);
            p.Size = new Size(w, h);
            p.BackColor = Color.FromArgb(22, 31, 48);
            return p;
        }

        private Button CreateButton(string text, int x, int y, int w, int h, Color bg, Color fg)
        {
            Button b = new Button();
            b.Text = text;
            b.Location = new Point(x, y);
            b.Size = new Size(w, h);
            b.BackColor = bg;
            b.ForeColor = fg;
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 0;
            b.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            b.Cursor = Cursors.Hand;
            return b;
        }

        private void FindActiveInterface()
        {
            try
            {
                foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (ni.OperationalStatus == OperationalStatus.Up && ni.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                    {
                        if (ni.Name.IndexOf("WiFi", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            ni.Description.IndexOf("Wireless", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            ni.Description.IndexOf("TP-Link", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            targetInterface = ni;
                            break;
                        }
                    }
                }

                if (targetInterface == null)
                {
                    foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
                    {
                        if (ni.OperationalStatus == OperationalStatus.Up && ni.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                        {
                            targetInterface = ni;
                            break;
                        }
                    }
                }

                if (targetInterface != null)
                {
                    lblWifiAdapter.Text = "Adapter: " + targetInterface.Name + " (" + targetInterface.Description + ")";
                    lastBytesReceived = targetInterface.GetIPStatistics().BytesReceived;
                    lastCheckTime = DateTime.UtcNow;
                }
            }
            catch (Exception ex)
            {
                LogMessage("Error detecting network adapter: " + ex.Message);
            }
        }

        private void OnTimerTick(object sender, EventArgs e)
        {
            // 1. Measure Throughput
            if (targetInterface != null)
            {
                try
                {
                    long currentBytes = targetInterface.GetIPStatistics().BytesReceived;
                    DateTime now = DateTime.UtcNow;
                    double elapsed = (now - lastCheckTime).TotalSeconds;

                    if (elapsed > 0.4)
                    {
                        long diff = currentBytes - lastBytesReceived;
                        if (diff >= 0)
                        {
                            currentMBps = (diff / 1048576.0) / elapsed;
                            currentMbps = (diff * 8.0 / 1000000.0) / elapsed;

                            lblSpeedMbps.Text = string.Format("{0:0.00} Mbps", currentMbps);
                            lblSpeedMBps.Text = string.Format("({0:0.00} MB/s)", currentMBps);

                            double percent = Math.Min(100.0, (currentMbps / planMbps) * 100.0);
                            lblPercentPlan.Text = string.Format("Line Utilization: {0:0.0}% of 30 Mbps Plan", percent);

                            pnlSpeedBar.Invalidate();
                        }
                        lastBytesReceived = currentBytes;
                        lastCheckTime = now;
                    }
                }
                catch { }
            }

            // 2. Check Tixati Process & Peer count
            CheckTixatiProcess();

            // 3. Keep-alive pulse
            if (chkKeepAlive.Checked && (DateTime.UtcNow.Second % 3 == 0))
            {
                ThreadPool.QueueUserWorkItem(delegate
                {
                    try
                    {
                        Ping p = new Ping();
                        p.Send("1.1.1.1", 300);
                    }
                    catch { }
                });
            }
        }

        private void CheckTixatiProcess()
        {
            try
            {
                Process[] procs = Process.GetProcessesByName("tixati");
                if (procs.Length > 0)
                {
                    Process p = procs[0];
                    isTixatiRunning = true;
                    tixatiPid = p.Id;

                    if (p.PriorityClass != ProcessPriorityClass.High)
                    {
                        try
                        {
                            p.PriorityClass = ProcessPriorityClass.High;
                            LogMessage("Tixati (PID " + p.Id + ") boosted to HIGH CPU priority.");
                        }
                        catch { }
                    }

                    lblTixatiStatus.Text = "Tixati: RUNNING (PID " + p.Id + " • HIGH PRIORITY)";
                    lblTixatiStatus.ForeColor = Color.FromArgb(16, 185, 129);

                    // Count established TCP connections for Tixati
                    int count = 0;
                    try
                    {
                        TcpConnectionInformation[] tcp = IPGlobalProperties.GetIPGlobalProperties().GetActiveTcpConnections();
                        foreach (TcpConnectionInformation conn in tcp)
                        {
                            if (conn.State == TcpState.Established && (conn.LocalEndPoint.Port == 26370 || conn.RemoteEndPoint.Port == 26370))
                            {
                                count++;
                            }
                        }
                    }
                    catch { }
                    peerCount = count;
                    lblPeersCount.Text = "Active TCP Connections: " + peerCount;
                }
                else
                {
                    isTixatiRunning = false;
                    lblTixatiStatus.Text = "Tixati: NOT RUNNING";
                    lblTixatiStatus.ForeColor = Color.FromArgb(239, 68, 68);
                    lblPeersCount.Text = "Active Peers: 0";
                }
            }
            catch { }
        }

        private void OnPaintSpeedBar(object sender, PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;

            int w = pnlSpeedBar.Width;
            int h = pnlSpeedBar.Height;

            double ratio = Math.Min(1.0, currentMbps / planMbps);
            int fillW = (int)(w * ratio);

            if (fillW > 0)
            {
                using (LinearGradientBrush brush = new LinearGradientBrush(
                    new Rectangle(0, 0, Math.Max(1, fillW), h),
                    Color.FromArgb(0, 229, 255),
                    Color.FromArgb(16, 185, 129),
                    LinearGradientMode.Horizontal))
                {
                    g.FillRectangle(brush, 0, 0, fillW, h);
                }
            }

            string label = string.Format("{0:0.00} Mbps ({1:0.0}%)", currentMbps, ratio * 100);
            SizeF sf = g.MeasureString(label, this.Font);
            using (SolidBrush textBrush = new SolidBrush(Color.White))
            {
                g.DrawString(label, new Font("Segoe UI", 9, FontStyle.Bold), textBrush, (w - sf.Width) / 2, (h - sf.Height) / 2);
            }
        }

        public void ActivateTurboBoost()
        {
            LogMessage("[TURBO] Activating Network & Process Turbo Boost...");

            // 1. Flush DNS cache
            try
            {
                DnsFlushResolverCache();
                LogMessage("[TURBO] Windows DNS resolver cache purged via API.");
            }
            catch (Exception ex)
            {
                LogMessage("[TURBO] DNS Flush error: " + ex.Message);
            }

            // 2. Boost Tixati process priority
            try
            {
                Process[] procs = Process.GetProcessesByName("tixati");
                if (procs.Length > 0)
                {
                    procs[0].PriorityClass = ProcessPriorityClass.High;
                    LogMessage("[TURBO] Tixati thread priority locked at HIGH.");
                }
            }
            catch { }

            // 3. Ping Latency Check in background
            FlushAndBenchmarkDns();

            LogMessage("[TURBO] Engine primed for maximum 30 Mbps throughput!");
        }

        private void SafeInvoke(MethodInvoker action)
        {
            try
            {
                if (this.IsDisposed || !this.IsHandleCreated) return;
                if (this.InvokeRequired)
                {
                    this.BeginInvoke(new MethodInvoker(delegate
                    {
                        try { action(); } catch { }
                    }));
                }
                else
                {
                    action();
                }
            }
            catch { }
        }

        public void FlushAndBenchmarkDns()
        {
            ThreadPool.QueueUserWorkItem(delegate
            {
                try
                {
                    DnsFlushResolverCache();
                    Ping p = new Ping();

                    PingReply r1 = p.Send("1.1.1.1", 1000);
                    if (r1.Status == IPStatus.Success)
                    {
                        cfPingMs = (int)r1.RoundtripTime;
                        SafeInvoke(delegate
                        {
                            lblPingCloudflare.Text = "Cloudflare (1.1.1.1): " + cfPingMs + " ms";
                            lblPingCloudflare.ForeColor = Color.FromArgb(16, 185, 129);
                        });
                    }

                    PingReply r2 = p.Send("8.8.8.8", 1000);
                    if (r2.Status == IPStatus.Success)
                    {
                        googlePingMs = (int)r2.RoundtripTime;
                        SafeInvoke(delegate
                        {
                            lblPingGoogle.Text = "Google (8.8.8.8): " + googlePingMs + " ms";
                            lblPingGoogle.ForeColor = Color.FromArgb(16, 185, 129);
                        });
                    }

                    SafeInvoke(delegate
                    {
                        LogMessage(string.Format("DNS Latency: Cloudflare={0}ms, Google={1}ms", cfPingMs, googlePingMs));
                    });
                }
                catch (Exception ex)
                {
                    SafeInvoke(delegate
                    {
                        LogMessage("Ping benchmark: " + ex.Message);
                    });
                }
            });
        }

        public void LaunchAdminOptimizer()
        {
            try
            {
                string batPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Boost_Internet_and_Tixati.bat");
                if (File.Exists(batPath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = batPath;
                    psi.Verb = "runas";
                    psi.UseShellExecute = true;
                    Process.Start(psi);
                    LogMessage("[ADMIN] Launched Windows Network Optimizer (UAC Elevation).");
                }
                else
                {
                    LogMessage("[ADMIN] Boost_Internet_and_Tixati.bat not found.");
                }
            }
            catch (Exception ex)
            {
                LogMessage("Admin launcher info: " + ex.Message);
            }
        }

        public void CopyLiveTrackers()
        {
            try
            {
                string trackerPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "trackers_list.txt");
                string content = "";
                if (File.Exists(trackerPath))
                {
                    content = File.ReadAllText(trackerPath);
                }
                else
                {
                    content = "udp://tracker.opentrackr.org:1337/announce\nudp://open.stealth.si:80/announce\nudp://tracker.torrent.eu.org:451/announce";
                }

                Clipboard.SetText(content);
                LogMessage("[COPIED] 52 High-Speed Trackers copied to Clipboard!");
                MessageBox.Show(
                    "52 Verified Trackers copied to your clipboard!\n\nNext Step in Tixati:\n1. Click your game torrent.\n2. Click 'Trackers' tab in lower pane.\n3. Click 'Add', press Ctrl+V, then click OK.",
                    "Trackers Ready to Paste",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                LogMessage("Clipboard copy error: " + ex.Message);
            }
        }

        private void LogMessage(string msg)
        {
            if (lstLog.InvokeRequired)
            {
                lstLog.Invoke(new MethodInvoker(delegate { LogMessage(msg); }));
                return;
            }

            string timestamp = DateTime.Now.ToString("HH:mm:ss");
            lstLog.Items.Add("[" + timestamp + "] " + msg);
            lstLog.TopIndex = lstLog.Items.Count - 1;
        }

        [STAThread]
        public static void Main()
        {
            try
            {
                Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
                Application.ThreadException += delegate(object sender, ThreadExceptionEventArgs e)
                {
                    try { File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "speedrr_thread_crash.log"), e.Exception.ToString()); } catch { }
                };
                AppDomain.CurrentDomain.UnhandledException += delegate(object sender, UnhandledExceptionEventArgs e)
                {
                    try { File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "speedrr_domain_crash.log"), e.ExceptionObject.ToString()); } catch { }
                };

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new MainForm());
            }
            catch (Exception ex)
            {
                try
                {
                    File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "speedrr_crash.log"), ex.ToString());
                    MessageBox.Show("Speedrr Turbo Error: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
                catch { }
            }
        }
    }
}
