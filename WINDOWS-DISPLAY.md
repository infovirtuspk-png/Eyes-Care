# Windows Display Control Architecture in Eyes Care

## 1. Color Temperature (Kelvin 1000K to 10000K)
Eyes Care converts color temperature into RGB spectral intensities using the Tanner Helland mathematical model:
- **Red Curve**: Calculated from logarithmic and exponential polynomial fits for $T \le 6600K$ and $T > 6600K$.
- **Green Curve**: Calculated from logarithmic and exponential polynomial fits.
- **Blue Curve**: Filtered aggressively at warm temperatures ($< 4000K$) to eliminate blue light emission ($400\text{ nm} - 480\text{ nm}$).

### Windows GDI P/Invoke Implementation
The 3-channel multipliers are converted to a 256-entry 16-bit array ($0$ to $65535$) and passed to `gdi32.dll!SetDeviceGammaRamp`:

```csharp
[DllImport("gdi32.dll")]
public static extern bool SetDeviceGammaRamp(IntPtr hDC, ref RAMP lpRamp);
```

---

## 2. Hardware vs Software Brightness Control

### Method A: Hardware Brightness (Laptops & eDP Displays)
- Uses Windows Management Instrumentation (WMI):
  `root\wmi:WmiMonitorBrightnessMethods.WmiSetBrightness(1, level)`
- Controls the physical backlight inverter without reducing display contrast.

### Method B: Software Gamma Scaling
- Scales the 16-bit gamma ramp curves proportionally by brightness percentage factor.
- Supported across all external HDMI, DisplayPort, DVI, and VGA desktop monitors.

---

## 3. Capability Detection
Upon boot, Eyes Care queries the display subsystem:
1. Detects all connected physical monitors using `System.Windows.Forms.Screen.AllScreens`.
2. Tests WMI brightness capability.
3. Automatically switches between hardware backlight control and GDI gamma scaling.
