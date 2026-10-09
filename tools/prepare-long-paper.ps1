$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$source = [System.Drawing.Bitmap]::new((Join-Path $root 'public/assets/writing-desk/paper.png'))
# Only a quiet central strip of the original paper. Mirroring makes its repeat seamless.
$strip = $source.Clone([System.Drawing.Rectangle]::new(0, 351, 1264, 80), $source.PixelFormat)
$tile = [System.Drawing.Bitmap]::new(1264, 160)
$graphics = [System.Drawing.Graphics]::FromImage($tile)
try {
    $graphics.DrawImageUnscaled($strip, 0, 0)
    $strip.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipY)
    $graphics.DrawImageUnscaled($strip, 0, 80)
    $tile.Save((Join-Path $root 'public/assets/writing-desk/paper-middle.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $graphics.Dispose()
    $tile.Dispose()
    $strip.Dispose()
    $source.Dispose()
}
