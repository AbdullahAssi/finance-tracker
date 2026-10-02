# Regenerates the app icon, Android adaptive icon layers and splash image in ./assets
# Usage (from the expense-tracker folder):  powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1
Add-Type -AssemblyName System.Drawing

$assets = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets'
$sky = [System.Drawing.ColorTranslator]::FromHtml('#7CC6F9')
$deep = [System.Drawing.ColorTranslator]::FromHtml('#3A9BEA')

function New-Canvas([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.PixelOffsetMode = 'HighQuality'
  $g.Clear([System.Drawing.Color]::Transparent)
  return @{ Bitmap = $bmp; G = $g; Size = $size }
}

function Add-RoundRect($path, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
}

function Draw-Gradient($c) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $c.Size, $c.Size
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $sky, $deep, 45
  $c.G.FillRectangle($brush, $rect)
  $brush.Dispose()
}

# Wallet mark drawn in a 100x100 design box, scaled to $box pixels and centred on the canvas.
function Draw-Wallet($c, [float]$box, $color) {
  $k = $box / 100
  $ox = ($c.Size - $box) / 2
  $oy = ($c.Size - $box) / 2
  $fill = New-Object System.Drawing.SolidBrush $color
  $soft = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(150, $color))

  # card peeking out of the top
  $card = New-Object System.Drawing.Drawing2D.GraphicsPath
  Add-RoundRect $card ($ox + 20 * $k) ($oy + 14 * $k) (50 * $k) (24 * $k) (7 * $k)
  $c.G.FillPath($soft, $card)

  # body with a clasp-shaped hole (alternate fill makes the overlap transparent)
  $body = New-Object System.Drawing.Drawing2D.GraphicsPath ([System.Drawing.Drawing2D.FillMode]::Alternate)
  Add-RoundRect $body ($ox + 6 * $k) ($oy + 26 * $k) (88 * $k) (60 * $k) (14 * $k)
  Add-RoundRect $body ($ox + 50 * $k) ($oy + 44 * $k) (38 * $k) (24 * $k) (12 * $k)
  $c.G.FillPath($fill, $body)

  # clasp dot
  $c.G.FillEllipse($fill, $ox + 58 * $k, $oy + 51 * $k, 10 * $k, 10 * $k)
}

function Save($c, $name) {
  $c.Bitmap.Save((Join-Path $assets $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $c.G.Dispose(); $c.Bitmap.Dispose()
  Write-Host "wrote $name"
}

$white = [System.Drawing.Color]::White

# App icon (full bleed gradient + mark)
$c = New-Canvas 1024; Draw-Gradient $c; Draw-Wallet $c 560 $white; Save $c 'icon.png'

# Android adaptive icon layers (mark stays inside the central safe zone)
$c = New-Canvas 1024; Draw-Gradient $c; Save $c 'android-icon-background.png'
$c = New-Canvas 1024; Draw-Wallet $c 520 $white; Save $c 'android-icon-foreground.png'
$c = New-Canvas 1024; Draw-Wallet $c 520 $white; Save $c 'android-icon-monochrome.png'

# Splash mark (white on the blue splash background)
$c = New-Canvas 1024; Draw-Wallet $c 640 $white; Save $c 'splash-icon.png'

# Small favicon
$c = New-Canvas 256; Draw-Gradient $c; Draw-Wallet $c 150 $white; Save $c 'favicon.png'
