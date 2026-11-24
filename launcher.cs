using System;
using System.IO;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Windows.Shell;
using System.Runtime.InteropServices;
using System.Net;
using System.Net.Sockets;
using System.Net.NetworkInformation;
using System.Threading;
using System.Text;

namespace VortexSpeedLauncher
{
    class Program
    {
        // =========================================================================
        // WIN32 NATIVE API IMPORTS
        // =========================================================================
        [DllImport("winmm.dll", EntryPoint = "timeBeginPeriod")]
        private static extern uint timeBeginPeriod(uint uMilliseconds);

        [DllImport("winmm.dll", EntryPoint = "timeEndPeriod")]
        private static extern uint timeEndPeriod(uint uMilliseconds);

        [DllImport("dnsapi.dll", EntryPoint = "DnsFlushResolverCache")]
        private static extern int DnsFlushResolverCache();

        [DllImport("shell32.dll", SetLastError = true)]
        public static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        [DllImport("shell32.dll", SetLastError = true)]
        public static extern int SHGetPropertyStoreForWindow(IntPtr hwnd, ref Guid riid, out IPropertyStore ppv);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern uint RegisterWindowMessage(string lpString);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool SetWindowText(IntPtr hWnd, string lpString);

        [DllImport("user32.dll")]
        public static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        public static extern bool IsIconic(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern bool IsWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        private const uint WM_SETICON = 0x0080;
        private const int ICON_SMALL = 0;
        private const int ICON_BIG = 1;
        private const int SW_RESTORE = 9;
        private const int SW_SHOW = 5;
        private static readonly IntPtr HWND_BROADCAST = (IntPtr)0xffff;

        // Registered Inter-Process Activation Message
        private static uint WM_VORTEX_ACTIVATE = 0;

        // COM Interface for Shell Link and Property Store
        [ComImport, Guid("00021401-0000-0000-C000-000000000046"), ClassInterface(ClassInterfaceType.None)]
        class ShellLink {}

        [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("000214F9-0000-0000-C000-000000000046")]
        interface IShellLinkW
        {
            void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszFile, int cch, IntPtr pfd, uint fFlags);
            void GetIDList(out IntPtr ppidl);
            void SetIDList(IntPtr pidl);
            void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszName, int cch);
            void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
            void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszDir, int cch);
            void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
            void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszArgs, int cch);
            void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
            void GetHotkey(out short pwHotkey);
            void SetHotkey(short wHotkey);
            void GetShowCmd(out int piShowCmd);
            void SetShowCmd(int iShowCmd);
            void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszIconPath, int cch, out int piIcon);
            void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
            void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string pszPathRel, uint dwReserved);
            void Resolve(IntPtr hwnd, uint fFlags);
            void SetPath([MarshalAs(UnmanagedType.LPWStr)] string pszFile);
        }

        [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("0000010b-0000-0000-C000-000000000046")]
        interface IPersistFile
        {
            void GetClassID(out Guid pClassID);
            [PreserveSig] int IsDirty();
            void Load([MarshalAs(UnmanagedType.LPWStr)] string pszFileName, uint dwMode);
            void Save([MarshalAs(UnmanagedType.LPWStr)] string pszFileName, [MarshalAs(UnmanagedType.Bool)] bool fRemember);
            void SaveCompleted([MarshalAs(UnmanagedType.LPWStr)] string pszFileName);
            void GetCurFile([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder ppszFileName);
        }

        [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99")]
        public interface IPropertyStore
        {
            [PreserveSig] int GetCount(out uint cProps);
            [PreserveSig] int GetAt(uint iProp, out PROPERTYKEY pkey);
            [PreserveSig] int GetValue(ref PROPERTYKEY key, out PROPVARIANT pv);
            [PreserveSig] int SetValue(ref PROPERTYKEY key, ref PROPVARIANT pv);
            [PreserveSig] int Commit();
        }

        [StructLayout(LayoutKind.Sequential, Pack = 4)]
        public struct PROPERTYKEY
        {
            public Guid fmtid;
            public uint pid;
        }

        [StructLayout(LayoutKind.Explicit)]
        public struct PROPVARIANT
        {
            [FieldOffset(0)] public ushort vt;
            [FieldOffset(8)] public IntPtr pwszVal;
        }

        // =========================================================================
        // APPLICATION STATE & LIFECYCLE FIELDS
        // =========================================================================
        private static NotifyIcon trayIcon = null;
        private static Process edgeProcess = null;
        private static Process nodeProcess = null;
        private static int backendProcessId = 0;
        private static IntPtr mainWindowHwnd = IntPtr.Zero;
        private static string appBaseDir = "";
        private static string iconFilePath = "";
        private static readonly object logLock = new object();

        public static void Log(string message)
        {
            try
            {
                lock (logLock)
                {
                    string logFile = Path.Combine(appBaseDir, "startup.log");
                    if (File.Exists(logFile))
                    {
                        FileInfo fi = new FileInfo(logFile);
                        if (fi.Length > 250 * 1024)
                        {
                            string[] lines = File.ReadAllLines(logFile);
                            int keep = Math.Min(lines.Length, 300);
                            string[] recent = new string[keep];
                            Array.Copy(lines, lines.Length - keep, recent, 0, keep);
                            File.WriteAllLines(logFile, recent);
                        }
                    }
                    string line = string.Format("[{0:yyyy-MM-dd HH:mm:ss.fff}] {1}", DateTime.Now, message);
                    File.AppendAllText(logFile, line + Environment.NewLine);
                }
            }
            catch { }
        }

        // IPC Bridge Form for reliable inter-process activation without broadcast
        public class IpcBridgeForm : Form
        {
            public IpcBridgeForm()
            {
                this.Text = "VortexSpeed_IPC_Bridge";
                this.ShowInTaskbar = false;
                this.WindowState = FormWindowState.Minimized;
                this.FormBorderStyle = FormBorderStyle.None;
                this.Size = new Size(0, 0);
            }

            protected override void WndProc(ref Message m)
            {
                if (m.Msg == (int)WM_VORTEX_ACTIVATE && WM_VORTEX_ACTIVATE != 0)
                {
                    Log("IPC Bridge received activation message from secondary launcher.");
                    BringExistingWindowToFront();
                    m.Result = (IntPtr)1;
                    return;
                }
                base.WndProc(ref m);
            }

            protected override void SetVisibleCore(bool value)
            {
                base.SetVisibleCore(false);
            }
        }

        private static IpcBridgeForm bridgeForm = null;
        private static Mutex appMutex = null;

        // =========================================================================
        // ENTRY POINT
        // =========================================================================
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
            }
            catch { }

            const string aumid = "VortexSpeed.TitaniumPro";
            appBaseDir = AppDomain.CurrentDomain.BaseDirectory;
            iconFilePath = Path.Combine(appBaseDir, "vortex_icon.ico");

            // Register global Windows activation message
            WM_VORTEX_ACTIVATE = RegisterWindowMessage("VortexSpeed_TitaniumPro_Activate_v8");

            Log("==================================================");
            Log("Vortex Speed Titanium Pro v8.0 Launcher initializing");
            Log("Base Directory: " + appBaseDir);

            // Step 1: Register Explicit AppUserModelID on process
            try { SetCurrentProcessExplicitAppUserModelID(aumid); } catch { }

            // Step 2: High-Resolution 1.0 ms Multimedia Timer & DNS Flush
            try { timeBeginPeriod(1); Log("Multimedia timer synchronized to 1.0 ms"); } catch { }
            try { DnsFlushResolverCache(); Log("DNS resolver cache flushed"); } catch { }

            // Step 3: Single Instance Enforcement with Mutex & IPC Message
            bool isNewInstance = false;
            try
            {
                appMutex = new Mutex(true, "VortexSpeedTitaniumProSingleInstanceMutex", out isNewInstance);
            }
            catch (Exception ex)
            {
                Log("WARN: Mutex check encountered: " + ex.Message);
                isNewInstance = false;
            }

            if (!isNewInstance)
            {
                Log("Secondary launcher invocation detected (Mutex locked). Notifying primary instance.");
                if (args != null && args.Length > 0)
                {
                    HandleActionArgument(args[0]);
                }

                // Send direct activation to primary instance IPC bridge
                IntPtr bridge = FindWindow(null, "VortexSpeed_IPC_Bridge");
                if (bridge != IntPtr.Zero)
                {
                    Log("IPC Bridge located (HWND: " + bridge + "). Sending activation message.");
                    PostMessage(bridge, WM_VORTEX_ACTIVATE, IntPtr.Zero, IntPtr.Zero);
                }
                else
                {
                    // Fallback to direct window restore
                    IntPtr existingHwnd = FindVortexWindow();
                    if (existingHwnd != IntPtr.Zero)
                    {
                        Log("Direct window handle located (HWND: " + existingHwnd + "). Restoring.");
                        ShowWindow(existingHwnd, SW_RESTORE);
                        SetForegroundWindow(existingHwnd);
                    }
                }

                return;
            }

            Log("Primary instance confirmed. Proceeding with sequenced startup.");

            // Register Application and Process Exit Handlers
            AppDomain.CurrentDomain.ProcessExit += (s, e) => CleanShutdown();

            // Step 4: Validate required application files
            if (!ValidateRequiredFiles())
            {
                Log("CRITICAL: File validation failed. Aborting startup.");
                CleanShutdown();
                return;
            }

            // Step 5: Register Windows Shell Shortcuts (.lnk) with AUMID
            CreateWindowsShortcuts(aumid);

            // Step 6: Register Windows Jump List
            SetupWindowsJumpList();

            // Step 7: Initialize Inter-Process Activation Bridge Form
            try
            {
                bridgeForm = new IpcBridgeForm();
                bridgeForm.Show();
                Log("Inter-process IPC Bridge form initialized.");
            }
            catch (Exception ex)
            {
                Log("WARN: Could not register IPC Bridge form: " + ex.Message);
            }

            // Step 8: Ensure Node.js Backend is running and healthy
            bool backendReady = EnsureBackendRunning();
            if (!backendReady)
            {
                Log("CRITICAL: Backend failed to initialize. Aborting startup.");
                CleanShutdown();
                return;
            }

            // Step 9: Launch Isolated Edge App Window ONLY after backend is confirmed ready
            LaunchEdgeWindow();

            // Step 10: Start Background Window Customizer Thread (Sets Icon & AUMID on HWND)
            Thread hookThread = new Thread(MonitorAndHookWindow);
            hookThread.IsBackground = true;
            hookThread.Start();

            // Step 11: Handle initial action if passed
            if (args != null && args.Length > 0)
            {
                HandleActionArgument(args[0]);
            }

            // Step 12: Start Native Windows Forms System Tray Application
            InitSystemTray();
            Log("Entering WinForms message loop (System Tray active).");
            Application.Run();
        }

        // =========================================================================
        // VALIDATION & PRE-FLIGHT CHECKS
        // =========================================================================
        private static bool ValidateRequiredFiles()
        {
            string[] requiredFiles = new string[]
            {
                Path.Combine(appBaseDir, "vortex-speed", "server.js"),
                Path.Combine(appBaseDir, "vortex-speed", "public", "index.html"),
                Path.Combine(appBaseDir, "vortex-speed", "database", "db.js"),
                Path.Combine(appBaseDir, "vortex-speed", "config", "settings.js")
            };

            foreach (string file in requiredFiles)
            {
                if (!File.Exists(file))
                {
                    Log("ERROR: Required file missing: " + file);
                    MessageBox.Show(
                        "Vortex Speed cannot start because essential files are missing:\n\n" +
                        file + "\n\n" +
                        "Please verify that the application has not been moved or partially deleted.",
                        "Vortex Speed — Missing Installation File",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return false;
                }
            }

            Log("All required core files validated successfully.");
            return true;
        }

        private static string FindNodeExecutable()
        {
            // 1. Program Files (64-bit)
            string p1 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe");
            if (File.Exists(p1)) return p1;

            // 2. Program Files (x86)
            string p2 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "node.exe");
            if (File.Exists(p2)) return p2;

            // 3. Local AppData
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string p3 = Path.Combine(localApp, "Programs", "node", "node.exe");
            if (File.Exists(p3)) return p3;

            // 4. NVM for Windows default location
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string nvmDir = Path.Combine(appData, "nvm");
            if (Directory.Exists(nvmDir))
            {
                try
                {
                    string[] candidates = Directory.GetFiles(nvmDir, "node.exe", SearchOption.AllDirectories);
                    if (candidates.Length > 0 && File.Exists(candidates[0])) return candidates[0];
                }
                catch { }
            }

            // 5. Search PATH environment variable
            string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
            string[] dirs = pathEnv.Split(';');
            foreach (string dir in dirs)
            {
                if (string.IsNullOrEmpty(dir)) continue;
                try
                {
                    string candidate = Path.Combine(dir.Trim(), "node.exe");
                    if (File.Exists(candidate)) return candidate;
                }
                catch { }
            }

            return null;
        }

        private static string FindBrowserExecutable()
        {
            // 1. Microsoft Edge (x86)
            string e1 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe");
            if (File.Exists(e1)) return e1;

            // 2. Microsoft Edge (64-bit)
            string e2 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe");
            if (File.Exists(e2)) return e2;

            // 3. Google Chrome (64-bit)
            string c1 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google", "Chrome", "Application", "chrome.exe");
            if (File.Exists(c1)) return c1;

            // 4. Google Chrome (x86)
            string c2 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google", "Chrome", "Application", "chrome.exe");
            if (File.Exists(c2)) return c2;

            return null;
        }

        private static bool IsPortOccupied(int port)
        {
            try
            {
                IPGlobalProperties ipProps = IPGlobalProperties.GetIPGlobalProperties();
                IPEndPoint[] listeners = ipProps.GetActiveTcpListeners();
                foreach (IPEndPoint ep in listeners)
                {
                    if (ep.Port == port) return true;
                }
            }
            catch { }
            return false;
        }

        public class HealthCheckResult
        {
            public bool IsHealthy;
            public int Pid;
            public string Status;
            public string DatabaseStatus;
            public int TelemetryRows;
            public string RawJson;
            public string ErrorMessage;
        }

        private static HealthCheckResult QueryBackendHealth()
        {
            HealthCheckResult result = new HealthCheckResult();
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:49876/api/health");
                req.Timeout = 600;
                req.Method = "GET";
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                using (StreamReader reader = new StreamReader(res.GetResponseStream()))
                {
                    result.RawJson = reader.ReadToEnd();
                    result.IsHealthy = (res.StatusCode == HttpStatusCode.OK) && result.RawJson.Contains("VortexSpeed-TitaniumPro");
                    
                    // Extract PID
                    int pidIdx = result.RawJson.IndexOf("\"pid\":");
                    if (pidIdx >= 0)
                    {
                        int endIdx = result.RawJson.IndexOf(",", pidIdx);
                        if (endIdx > pidIdx)
                        {
                            string pidStr = result.RawJson.Substring(pidIdx + 6, endIdx - (pidIdx + 6)).Trim();
                            int p;
                            if (int.TryParse(pidStr, out p)) result.Pid = p;
                        }
                    }

                    // Extract Database status
                    if (result.RawJson.Contains("\"status\":\"CONNECTED\""))
                    {
                        result.DatabaseStatus = "CONNECTED";
                    }
                    else
                    {
                        result.DatabaseStatus = "ERROR";
                    }

                    // Extract overall status
                    result.Status = result.IsHealthy ? "HEALTHY" : "DEGRADED";

                    // Extract TelemetryRows
                    int telIdx = result.RawJson.IndexOf("\"telemetryRows\":");
                    if (telIdx >= 0)
                    {
                        int telEnd = result.RawJson.IndexOfAny(new char[] { ',', '}' }, telIdx);
                        if (telEnd > telIdx)
                        {
                            string tStr = result.RawJson.Substring(telIdx + 16, telEnd - (telIdx + 16)).Trim();
                            int tRows;
                            if (int.TryParse(tStr, out tRows)) result.TelemetryRows = tRows;
                        }
                    }

                    return result;
                }
            }
            catch (WebException wex)
            {
                result.IsHealthy = false;
                result.ErrorMessage = wex.Message;
                if (wex.Response != null)
                {
                    try
                    {
                        using (StreamReader r = new StreamReader(wex.Response.GetResponseStream()))
                        {
                            result.RawJson = r.ReadToEnd();
                        }
                    }
                    catch { }
                }
                return result;
            }
            catch (Exception ex)
            {
                result.IsHealthy = false;
                result.ErrorMessage = ex.Message;
                return result;
            }
        }

        // =========================================================================
        // BACKEND SEQUENCING & HEALTH POLLING
        // =========================================================================
        private static bool EnsureBackendRunning()
        {
            Log("Verifying backend readiness on http://127.0.0.1:49876/api/health");

            // 1. Check if backend is already active and healthy
            HealthCheckResult existing = QueryBackendHealth();
            if (existing.IsHealthy)
            {
                backendProcessId = existing.Pid;
                Log(string.Format("Existing backend confirmed healthy! PID: {0}, SQLite: {1}", backendProcessId, existing.DatabaseStatus));
                return true;
            }

            // 2. If not healthy, check if port 49876 is occupied by an alien/foreign process
            if (IsPortOccupied(49876))
            {
                Log("ERROR: Port 49876 is occupied by another process, but /api/health did not respond.");
                MessageBox.Show(
                    "Port 49876 is currently occupied by another application.\n\n" +
                    "Vortex Speed requires port 49876 for its local intelligence engine.\n" +
                    "Please close the application using port 49876 and launch Vortex Speed again.",
                    "Vortex Speed — Port Conflict",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return false;
            }

            // 3. Locate Node.js executable
            string nodeExe = FindNodeExecutable();
            if (string.IsNullOrEmpty(nodeExe))
            {
                Log("ERROR: Node.js executable not located on system.");
                MessageBox.Show(
                    "Node.js runtime was not found on this computer.\n\n" +
                    "Vortex Speed requires Node.js (v18+) to run its local autonomous intelligence engine.\n" +
                    "Please install Node.js from https://nodejs.org or ensure node.exe is in your system PATH.",
                    "Vortex Speed — Missing Runtime",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return false;
            }

            Log("Discovered Node.js runtime: " + nodeExe);

            string serverScript = Path.Combine(appBaseDir, "vortex-speed", "server.js");
            Log("Spawning backend engine process: " + serverScript);

            StringBuilder errorOutput = new StringBuilder();

            try
            {
                ProcessStartInfo nPsi = new ProcessStartInfo();
                nPsi.FileName = nodeExe;
                nPsi.Arguments = "\"" + serverScript + "\"";
                nPsi.WorkingDirectory = Path.Combine(appBaseDir, "vortex-speed");
                nPsi.CreateNoWindow = true;
                nPsi.WindowStyle = ProcessWindowStyle.Hidden;
                nPsi.UseShellExecute = false;
                nPsi.RedirectStandardError = true;
                nPsi.RedirectStandardOutput = false;

                nodeProcess = new Process();
                nodeProcess.StartInfo = nPsi;
                nodeProcess.ErrorDataReceived += (sender, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        errorOutput.AppendLine(e.Data);
                    }
                };

                nodeProcess.Start();
                nodeProcess.BeginErrorReadLine();
                backendProcessId = nodeProcess.Id;
                Log("Spawned Node.js backend process ID: " + backendProcessId);
            }
            catch (Exception ex)
            {
                Log("ERROR spawning Node process: " + ex.Message);
                MessageBox.Show(
                    "Failed to start Vortex Speed backend process:\n\n" + ex.Message,
                    "Startup Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return false;
            }

            // 4. Polling loop: Wait for genuine readiness without arbitrary sleep delays
            DateTime startTime = DateTime.UtcNow;
            bool isReady = false;

            while ((DateTime.UtcNow - startTime).TotalMilliseconds < 12000)
            {
                if (nodeProcess != null && nodeProcess.HasExited)
                {
                    string errOut = errorOutput.ToString().Trim();
                    Log("ERROR: Node process exited prematurely (exit code " + nodeProcess.ExitCode + "). Error output: " + errOut);
                    MessageBox.Show(
                        "Vortex Speed backend process exited unexpectedly during startup (Exit Code: " + nodeProcess.ExitCode + "):\n\n" +
                        (string.IsNullOrEmpty(errOut) ? "No standard error output reported." : errOut),
                        "Backend Startup Failure",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return false;
                }

                HealthCheckResult check = QueryBackendHealth();
                if (check.IsHealthy)
                {
                    isReady = true;
                    int ms = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;
                    backendProcessId = check.Pid > 0 ? check.Pid : backendProcessId;
                    Log(string.Format("Backend confirmed ready! Health check passed in {0} ms. SQLite Status: {1}", ms, check.DatabaseStatus));
                    break;
                }

                Thread.Sleep(100);
            }

            if (!isReady)
            {
                string errOut = errorOutput.ToString().Trim();
                Log("ERROR: Backend health check timed out after 12 seconds. Captured errors: " + errOut);

                try
                {
                    if (nodeProcess != null && !nodeProcess.HasExited) nodeProcess.Kill();
                }
                catch { }

                MessageBox.Show(
                    "Vortex Speed backend server timed out during initialization on port 49876.\n\n" +
                    (string.IsNullOrEmpty(errOut) ? "Please inspect startup.log in the application folder for details." : "Diagnostics:\n" + errOut),
                    "Backend Timeout",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
                return false;
            }

            return true;
        }

        // =========================================================================
        // EDGE APPLICATION WINDOW LAUNCHER
        // =========================================================================
        private static void LaunchEdgeWindow()
        {
            string browserPath = FindBrowserExecutable();
            string profileDir = Path.Combine(appBaseDir, "vortex_profile");

            // Clean up stale Chromium profile locks to prevent silent exit
            try
            {
                if (Directory.Exists(profileDir))
                {
                    string sLock = Path.Combine(profileDir, "SingletonLock");
                    if (File.Exists(sLock)) File.Delete(sLock);
                    string sCookie = Path.Combine(profileDir, "SingletonCookie");
                    if (File.Exists(sCookie)) File.Delete(sCookie);
                    string sSocket = Path.Combine(profileDir, "SingletonSocket");
                    if (File.Exists(sSocket)) File.Delete(sSocket);
                }
            }
            catch { }

            string edgeArgs = string.Format(
                "--app=\"http://127.0.0.1:49876\" --remote-debugging-port=9222 --user-data-dir=\"{0}\" --class=\"VortexSpeed\" --window-size=1280,850 --no-first-run --no-default-browser-check --disable-background-mode",
                profileDir
            );

            if (!string.IsNullOrEmpty(browserPath))
            {
                Log("Launching application window via: " + browserPath);
                try
                {
                    ProcessStartInfo ePsi = new ProcessStartInfo();
                    ePsi.FileName = browserPath;
                    ePsi.Arguments = edgeArgs;
                    ePsi.UseShellExecute = false;
                    edgeProcess = Process.Start(ePsi);
                    Log("Application window process started (PID: " + (edgeProcess != null ? edgeProcess.Id.ToString() : "unknown") + ")");
                }
                catch (Exception ex)
                {
                    Log("WARN: Browser launch failed: " + ex.Message + ". Falling back to default shell handler.");
                    try { Process.Start("http://127.0.0.1:49876"); } catch { }
                }
            }
            else
            {
                Log("WARN: No standalone Chromium browser found. Opening default browser.");
                try { Process.Start("http://127.0.0.1:49876"); } catch { }
            }
        }

        private static IntPtr FindVortexWindow()
        {
            IntPtr found = IntPtr.Zero;
            EnumWindows((hwnd, lParam) =>
            {
                if (!IsWindow(hwnd)) return true;

                uint processId;
                GetWindowThreadProcessId(hwnd, out processId);

                // Check PID match if edgeProcess is active
                if (edgeProcess != null && processId == (uint)edgeProcess.Id)
                {
                    StringBuilder checkText = new StringBuilder(256);
                    GetWindowText(hwnd, checkText, 256);
                    if (checkText.Length > 0)
                    {
                        found = hwnd;
                        return false;
                    }
                }

                // Check window title
                StringBuilder sb = new StringBuilder(256);
                GetWindowText(hwnd, sb, 256);
                string title = sb.ToString();
                if (title.Contains("VORTEX SPEED") || title.Contains("127.0.0.1:49876") || title.Contains("Vortex Speed") || title.Contains("Titanium Pro"))
                {
                    found = hwnd;
                    return false;
                }
                return true;
            }, IntPtr.Zero);
            return found;
        }

        private static void MonitorAndHookWindow()
        {
            IntPtr hIconBig = IntPtr.Zero;
            IntPtr hIconSmall = IntPtr.Zero;

            if (File.Exists(iconFilePath))
            {
                try
                {
                    using (Icon icon = new Icon(iconFilePath, 32, 32))
                    {
                        hIconBig = icon.Handle;
                    }
                    using (Icon icon = new Icon(iconFilePath, 16, 16))
                    {
                        hIconSmall = icon.Handle;
                    }
                }
                catch { }
            }

            for (int i = 0; i < 20; i++)
            {
                Thread.Sleep(500);
                IntPtr hwnd = FindVortexWindow();
                if (hwnd != IntPtr.Zero)
                {
                    mainWindowHwnd = hwnd;

                    // 1. Set Custom Window Icon
                    if (hIconBig != IntPtr.Zero)
                    {
                        SendMessage(hwnd, WM_SETICON, (IntPtr)ICON_BIG, hIconBig);
                    }
                    if (hIconSmall != IntPtr.Zero)
                    {
                        SendMessage(hwnd, WM_SETICON, (IntPtr)ICON_SMALL, hIconSmall);
                    }

                    // 2. Set Window Title
                    SetWindowText(hwnd, "Vortex Speed — Titanium Pro v8.0");

                    // 3. Set Window AppUserModelID
                    try
                    {
                        Guid guidPropertyStore = new Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99");
                        IPropertyStore pStore;
                        int hr = SHGetPropertyStoreForWindow(hwnd, ref guidPropertyStore, out pStore);
                        if (hr == 0 && pStore != null)
                        {
                            PROPERTYKEY key = new PROPERTYKEY
                            {
                                fmtid = new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),
                                pid = 5
                            };
                            PROPVARIANT pv = new PROPVARIANT
                            {
                                vt = 31,
                                pwszVal = Marshal.StringToCoTaskMemUni("VortexSpeed.TitaniumPro")
                            };
                            pStore.SetValue(ref key, ref pv);
                            pStore.Commit();
                        }
                    }
                    catch { }

                    Log("Successfully hooked window (HWND: " + hwnd + ") with custom branding and AUMID.");
                    break;
                }
            }
        }

        // =========================================================================
        // WINDOWS SHELL SHORTCUTS & JUMP LISTS
        // =========================================================================
        private static void CreateWindowsShortcuts(string aumid)
        {
            try
            {
                string exePath = Path.Combine(appBaseDir, "VortexSpeed.exe");
                string startMenu = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                string lnkStart = Path.Combine(startMenu, "Vortex Speed.lnk");
                CreateShortcutWithAumid(lnkStart, exePath, appBaseDir, iconFilePath, aumid, "Vortex Speed — Titanium Pro v8.0 Autonomous Network Platform");

                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string lnkDesktop = Path.Combine(desktop, "Vortex Speed.lnk");
                CreateShortcutWithAumid(lnkDesktop, exePath, appBaseDir, iconFilePath, aumid, "Vortex Speed — Titanium Pro v8.0 Autonomous Network Platform");
            }
            catch { }
        }

        private static void CreateShortcutWithAumid(string lnkPath, string exePath, string workDir, string iconPath, string aumid, string desc)
        {
            try
            {
                IShellLinkW link = (IShellLinkW)new ShellLink();
                link.SetPath(exePath);
                link.SetWorkingDirectory(workDir);
                link.SetDescription(desc);
                if (File.Exists(iconPath))
                {
                    link.SetIconLocation(iconPath, 0);
                }

                IPropertyStore store = (IPropertyStore)link;
                PROPERTYKEY key = new PROPERTYKEY
                {
                    fmtid = new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),
                    pid = 5
                };

                PROPVARIANT pv = new PROPVARIANT
                {
                    vt = 31,
                    pwszVal = Marshal.StringToCoTaskMemUni(aumid)
                };

                store.SetValue(ref key, ref pv);
                store.Commit();

                ((IPersistFile)link).Save(lnkPath, true);
            }
            catch { }
        }

        private static void SetupWindowsJumpList()
        {
            try
            {
                JumpList jumpList = new JumpList();
                string exePath = Path.Combine(appBaseDir, "VortexSpeed.exe");

                JumpTask task1 = new JumpTask
                {
                    Title = "Run Speed Test",
                    Description = "Initiate instant multi-stream speed test",
                    ApplicationPath = exePath,
                    Arguments = "--action=speedtest",
                    IconResourcePath = File.Exists(iconFilePath) ? iconFilePath : exePath
                };

                JumpTask task2 = new JumpTask
                {
                    Title = "Bufferbloat Diagnostic",
                    Description = "Measure loaded latency and buffer saturation",
                    ApplicationPath = exePath,
                    Arguments = "--action=bufferbloat",
                    IconResourcePath = File.Exists(iconFilePath) ? iconFilePath : exePath
                };

                JumpTask task3 = new JumpTask
                {
                    Title = "Check Internet Connection",
                    Description = "Instant 4-pillar connectivity check",
                    ApplicationPath = exePath,
                    Arguments = "--action=checknet",
                    IconResourcePath = File.Exists(iconFilePath) ? iconFilePath : exePath
                };

                JumpTask task4 = new JumpTask
                {
                    Title = "NOVA Intelligence",
                    Description = "Autonomous network diagnostics & advice",
                    ApplicationPath = exePath,
                    Arguments = "--tab=nova",
                    IconResourcePath = File.Exists(iconFilePath) ? iconFilePath : exePath
                };

                JumpTask task5 = new JumpTask
                {
                    Title = "Network Autopilot",
                    Description = "Real-time autonomous line stabilizer",
                    ApplicationPath = exePath,
                    Arguments = "--tab=autopilot",
                    IconResourcePath = File.Exists(iconFilePath) ? iconFilePath : exePath
                };

                jumpList.JumpItems.Add(task1);
                jumpList.JumpItems.Add(task2);
                jumpList.JumpItems.Add(task3);
                jumpList.JumpItems.Add(task4);
                jumpList.JumpItems.Add(task5);

                jumpList.ShowFrequentCategory = false;
                jumpList.ShowRecentCategory = false;

                JumpList.SetJumpList(System.Windows.Application.Current ?? new System.Windows.Application(), jumpList);
                jumpList.Apply();
            }
            catch { }
        }

        // =========================================================================
        // SYSTEM TRAY & WINDOW MANAGEMENT
        // =========================================================================
        private static void InitSystemTray()
        {
            trayIcon = new NotifyIcon();
            trayIcon.Text = "Vortex Speed — Titanium Pro v8.1";

            if (File.Exists(iconFilePath))
            {
                try { trayIcon.Icon = new Icon(iconFilePath); }
                catch { trayIcon.Icon = SystemIcons.Application; }
            }
            else
            {
                trayIcon.Icon = SystemIcons.Application;
            }

            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add("⚡ Open Vortex Speed", null, (s, e) => BringExistingWindowToFront());
            menu.Items.Add("🚀 Run Speed Test", null, (s, e) => ExecuteHttpAction("/api/speed/start", true, "Speed Test Started"));
            menu.Items.Add("🩺 Check Internet Connection", null, (s, e) => ExecuteHttpAction("/api/quick-check", false, "Internet Health Check"));
            menu.Items.Add("📊 Live Network Status", null, (s, e) => ShowNetworkStatusBalloon());
            menu.Items.Add("🛡️ Toggle Network Autopilot", null, (s, e) => ExecuteHttpAction("/api/autopilot/toggle", true, "Autopilot Toggled"));
            menu.Items.Add("⚙️ Settings & Vault", null, (s, e) => BringExistingWindowToFront());
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("❌ Exit Vortex Speed", null, (s, e) => ExitApplication());

            trayIcon.ContextMenuStrip = menu;
            trayIcon.Visible = true;
            trayIcon.DoubleClick += (s, e) => BringExistingWindowToFront();

            trayIcon.ShowBalloonTip(2000, "Vortex Speed v8.0 Active", "Titanium Pro is running autonomously in the system tray.", ToolTipIcon.Info);
        }

        private static void ShowNetworkStatusBalloon()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:49876/api/telemetry");
                req.Timeout = 1500;
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                using (StreamReader reader = new StreamReader(res.GetResponseStream()))
                {
                    string json = reader.ReadToEnd();
                    trayIcon.ShowBalloonTip(3000, "📊 Network Status", "Autonomous monitoring active on port 49876.", ToolTipIcon.Info);
                }
            }
            catch
            {
                trayIcon.ShowBalloonTip(2000, "Network Status", "Unable to query live telemetry from backend.", ToolTipIcon.Warning);
            }
        }

        private static void ExecuteHttpAction(string path, bool isPost, string successMessage)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:49876" + path);
                req.Method = isPost ? "POST" : "GET";
                req.Timeout = 3000;
                if (isPost)
                {
                    byte[] body = Encoding.UTF8.GetBytes("{}");
                    req.ContentType = "application/json";
                    req.ContentLength = body.Length;
                    using (Stream stream = req.GetRequestStream())
                    {
                        stream.Write(body, 0, body.Length);
                    }
                }
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    trayIcon.ShowBalloonTip(2000, "Vortex Speed", successMessage, ToolTipIcon.Info);
                }
            }
            catch (Exception ex)
            {
                trayIcon.ShowBalloonTip(2000, "Vortex Speed", "Action failed: " + ex.Message, ToolTipIcon.Warning);
            }
        }

        private static void HandleActionArgument(string arg)
        {
            if (string.IsNullOrEmpty(arg)) return;
            if (arg.Contains("speedtest"))
            {
                ExecuteHttpAction("/api/speed/start", true, "Speed Test Started");
            }
            else if (arg.Contains("checknet"))
            {
                ExecuteHttpAction("/api/quick-check", false, "Internet Health Check Initiated");
            }
            else if (arg.Contains("bufferbloat"))
            {
                ExecuteHttpAction("/api/bufferbloat/start", true, "Bufferbloat Test Initiated");
            }
        }

        public static void BringExistingWindowToFront()
        {
            IntPtr hwnd = FindVortexWindow();
            if (hwnd != IntPtr.Zero && IsWindow(hwnd))
            {
                mainWindowHwnd = hwnd;
                ShowWindow(hwnd, SW_RESTORE);
                SetForegroundWindow(hwnd);
                Log("Brought existing window to front (HWND: " + hwnd + ")");
            }
            else
            {
                Log("No active window found. Relaunching Edge application window while backend is active.");
                LaunchEdgeWindow();
            }
        }

        // =========================================================================
        // PROCESS LIFECYCLE & CLEAN SHUTDOWN
        // =========================================================================
        private static void CleanShutdown()
        {
            Log("Executing clean shutdown sequence.");

            // 1. Terminate Edge application window process
            try
            {
                if (edgeProcess != null && !edgeProcess.HasExited)
                {
                    edgeProcess.Kill();
                    edgeProcess = null;
                }
            }
            catch { }

            // 2. Request backend graceful shutdown via HTTP
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:49876/api/system/shutdown");
                req.Method = "POST";
                req.Timeout = 1000;
                byte[] body = Encoding.UTF8.GetBytes("{}");
                req.ContentType = "application/json";
                req.ContentLength = body.Length;
                using (Stream stream = req.GetRequestStream())
                {
                    stream.Write(body, 0, body.Length);
                }
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse()) { }
                Thread.Sleep(300);
            }
            catch { }

            // 3. Terminate own backend process if still running (DO NOT touch unrelated node processes)
            try
            {
                if (nodeProcess != null && !nodeProcess.HasExited)
                {
                    nodeProcess.Kill();
                    nodeProcess = null;
                }
                else if (backendProcessId > 0)
                {
                    Process p = Process.GetProcessById(backendProcessId);
                    if (p != null && !p.HasExited)
                    {
                        p.Kill();
                    }
                }
            }
            catch { }

            // 4. Close IPC bridge form
            try
            {
                if (bridgeForm != null)
                {
                    bridgeForm.Close();
                    bridgeForm.Dispose();
                    bridgeForm = null;
                }
            }
            catch { }

            // 5. Release Mutex cleanly
            try
            {
                if (appMutex != null)
                {
                    appMutex.ReleaseMutex();
                    appMutex.Dispose();
                    appMutex = null;
                }
            }
            catch { }

            // 6. Release Multimedia Timer
            try { timeEndPeriod(1); } catch { }
        }

        private static void ExitApplication()
        {
            Log("Exit requested from user. Disposing tray and shutting down.");
            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
                trayIcon = null;
            }

            CleanShutdown();

            Application.Exit();
            Environment.Exit(0);
        }
    }
}
