import os
import math
import resvg_py
from PIL import Image, ImageDraw, ImageFont

# Brand color palette
COLOR_PRIMARY = "#4F46E5"        # Indigo 600
COLOR_PRIMARY_DARK = "#3730A3"   # Indigo 800
COLOR_PRIMARY_DEEP = "#312E81"   # Indigo 900
COLOR_PRIMARY_LIGHT = "#6366F1"  # Indigo 500
COLOR_PRIMARY_FAINT = "#EEF2FF"  # Indigo 50
COLOR_ACCENT = "#818CF8"         # Indigo 400
COLOR_WHITE = "#FFFFFF"

def build_svg(mode="full_color", bg="clean"):
    """
    mode: 'full_color' | 'monochrome'
    bg: 'clean' (opaque background for icon.png) | 'transparent' (for adaptive-icon.png)
    """
    bg_element = ""
    if bg == "clean":
        bg_element = f"""
        <defs>
            <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#FFFFFF"/>
                <stop offset="50%" stop-color="#EEF2FF"/>
                <stop offset="100%" stop-color="#E0E7FF"/>
            </linearGradient>
            <radialGradient id="glowGrad" cx="50%" cy="46%" r="58%">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.85"/>
                <stop offset="60%" stop-color="#EEF2FF" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#E0E7FF" stop-opacity="0"/>
            </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#bgGrad)"/>
        <rect width="1024" height="1024" fill="url(#glowGrad)"/>
        """

    if mode == "monochrome":
        grad_horn = '<linearGradient id="hornGrad" x1="0" y1="0" x2="1" y2="0.8"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#FFFFFF"/></linearGradient>'
        color_driver = "#FFFFFF"
        color_handle = "#FFFFFF"
        color_rim = "#FFFFFF"
        color_inner = "#FFFFFF"
        color_pulse = "#FFFFFF"
        color_pulse_dot = "#FFFFFF"
        color_wave1 = "#FFFFFF"
        color_wave2 = "#FFFFFF"
        color_wave3 = "#FFFFFF"
        wave_opacities = (0.75, 0.88, 1.0)
        inner_opacity = 0.35
        driver_opacity = 0.95
        handle_opacity = 0.90
        shadow_markup = ""
    else:
        grad_horn = f"""
        <linearGradient id="hornGrad" x1="0" y1="0.2" x2="1" y2="0.8">
            <stop offset="0%" stop-color="{COLOR_PRIMARY_DARK}"/>
            <stop offset="45%" stop-color="{COLOR_PRIMARY}"/>
            <stop offset="100%" stop-color="{COLOR_PRIMARY_LIGHT}"/>
        </linearGradient>
        <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="{COLOR_ACCENT}"/>
            <stop offset="100%" stop-color="{COLOR_PRIMARY}"/>
        </linearGradient>
        <linearGradient id="wave1Grad" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stop-color="{COLOR_ACCENT}"/>
            <stop offset="100%" stop-color="{COLOR_PRIMARY_LIGHT}"/>
        </linearGradient>
        <linearGradient id="wave2Grad" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stop-color="{COLOR_PRIMARY_LIGHT}"/>
            <stop offset="100%" stop-color="{COLOR_PRIMARY}"/>
        </linearGradient>
        <linearGradient id="wave3Grad" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stop-color="{COLOR_PRIMARY}"/>
            <stop offset="100%" stop-color="{COLOR_PRIMARY_DARK}"/>
        </linearGradient>
        <linearGradient id="handleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="{COLOR_PRIMARY_DARK}"/>
            <stop offset="100%" stop-color="{COLOR_PRIMARY_DEEP}"/>
        </linearGradient>
        """
        color_driver = COLOR_PRIMARY_DARK
        color_handle = "url(#handleGrad)"
        color_rim = "url(#rimGrad)"
        color_inner = COLOR_PRIMARY_DEEP
        color_pulse = COLOR_WHITE
        color_pulse_dot = COLOR_PRIMARY_LIGHT
        color_wave1 = "url(#wave1Grad)"
        color_wave2 = "url(#wave2Grad)"
        color_wave3 = "url(#wave3Grad)"
        wave_opacities = (1.0, 1.0, 1.0)
        inner_opacity = 0.8
        driver_opacity = 1.0
        handle_opacity = 1.0

        if bg == "clean":
            shadow_markup = """
            <filter id="markShadow" x="-15%" y="-15%" width="135%" height="135%">
                <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#312E81" flood-opacity="0.16"/>
                <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#4F46E5" flood-opacity="0.12"/>
            </filter>
            """
        else:
            shadow_markup = ""

    # Positioning: center of the composition at (512, 512)
    # The mouth of the horn is at x = 462, y = 512.
    # Waves are concentric circular arcs centered at (462, 512).
    # Horn extends left to x = 270. Handle down to y = 675.
    # Safe zone circle radius is 338px. Maximum radius from (512, 512) is 308px.
    cx_wave = 472
    cy_wave = 512

    def polar_to_cart(cx, cy, r, angle_deg):
        rad = math.radians(angle_deg)
        return cx + r * math.cos(rad), cy + r * math.sin(rad)

    def svg_arc(cx, cy, r, start_deg, end_deg):
        x1, y1 = polar_to_cart(cx, cy, r, start_deg)
        x2, y2 = polar_to_cart(cx, cy, r, end_deg)
        large_arc = 1 if (end_deg - start_deg) > 180 else 0
        return f"M {x1:.2f} {y1:.2f} A {r:.2f} {r:.2f} 0 {large_arc} 1 {x2:.2f} {y2:.2f}"

    arc1 = svg_arc(cx_wave, cy_wave, 96, -46, 46)
    arc2 = svg_arc(cx_wave, cy_wave, 172, -51, 51)
    arc3 = svg_arc(cx_wave, cy_wave, 248, -55, 55)

    filter_attr = 'filter="url(#markShadow)"' if (bg == "clean" and mode != "monochrome") else ""

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        {bg_element}
        <defs>
            {grad_horn}
            {shadow_markup}
        </defs>

        <g id="campaignAmplifierMark" {filter_attr}>
            <!-- Ergonomic Handle -->
            <path d="M 305 540 
                     L 278 642 
                     C 272 664, 292 680, 314 676 
                     L 348 546 Z"
                  fill="{color_handle}"
                  opacity="{handle_opacity}"/>

            <!-- Driver Base Cylinder -->
            <rect x="270" y="472" width="62" height="80" rx="18" fill="{color_driver}" opacity="{driver_opacity}"/>

            <!-- Acoustic Horn Bell Body -->
            <path d="M 324 476
                     C 372 476, 408 388, 462 376
                     L 462 648
                     C 408 636, 372 548, 324 548
                     Z"
                  fill="url(#hornGrad)"/>

            <!-- Horn Mouth Outer Rim (Acoustic Aperture) -->
            <ellipse cx="462" cy="512" rx="24" ry="136" fill="{color_rim}"/>

            <!-- Horn Interior Depth -->
            <ellipse cx="462" cy="512" rx="13" ry="106" fill="{color_inner}" opacity="{inner_opacity}"/>

            <!-- Central Acoustic Pulse Node -->
            <circle cx="462" cy="512" r="16" fill="{color_pulse}"/>
            <circle cx="462" cy="512" r="7" fill="{color_pulse_dot}"/>

            <!-- Radiating Message Amplification Arcs -->
            <g id="amplificationWaves">
                <!-- Wave 1 (Inner Reach) -->
                <path d="{arc1}"
                      fill="none"
                      stroke="{color_wave1}"
                      stroke-width="32"
                      stroke-linecap="round"
                      opacity="{wave_opacities[0]}"/>

                <!-- Wave 2 (Expanded Reach) -->
                <path d="{arc2}"
                      fill="none"
                      stroke="{color_wave2}"
                      stroke-width="34"
                      stroke-linecap="round"
                      opacity="{wave_opacities[1]}"/>

                <!-- Wave 3 (Maximum Reach) -->
                <path d="{arc3}"
                      fill="none"
                      stroke="{color_wave3}"
                      stroke-width="36"
                      stroke-linecap="round"
                      opacity="{wave_opacities[2]}"/>
            </g>
        </g>
    </svg>"""
    return svg

def generate_assets():
    os.makedirs("mobile/assets", exist_ok=True)
    os.makedirs("docs", exist_ok=True)

    # 1. icon.png (1024x1024, opaque clean background, no transparency, no rounded corners)
    svg_icon = build_svg(mode="full_color", bg="clean")
    png_icon_bytes = resvg_py.svg_to_bytes(svg_icon)
    import io
    img_icon_rgb = Image.open(io.BytesIO(png_icon_bytes)).convert("RGB")
    img_icon_rgb.save("mobile/assets/icon.png", "PNG", optimize=True)

    # 2. adaptive-icon.png (1024x1024, transparent background, artwork in central safe-zone)
    svg_adaptive = build_svg(mode="full_color", bg="transparent")
    png_adaptive_bytes = resvg_py.svg_to_bytes(svg_adaptive)
    with open("mobile/assets/adaptive-icon.png", "wb") as f:
        f.write(png_adaptive_bytes)
    # Also write to android-icon-foreground.png for backward compat
    with open("mobile/assets/android-icon-foreground.png", "wb") as f:
        f.write(png_adaptive_bytes)

    # 3. adaptive-icon-monochrome.png (1024x1024, monochrome silhouette, transparent background)
    svg_monochrome = build_svg(mode="monochrome", bg="transparent")
    png_mono_bytes = resvg_py.svg_to_bytes(svg_monochrome)
    with open("mobile/assets/adaptive-icon-monochrome.png", "wb") as f:
        f.write(png_mono_bytes)
    with open("mobile/assets/android-icon-monochrome.png", "wb") as f:
        f.write(png_mono_bytes)

    # 4. splash-icon.png (clean, centered brand mark, transparent background)
    with open("mobile/assets/splash-icon.png", "wb") as f:
        f.write(png_adaptive_bytes)

    # 5. favicon.png (48x48)
    img_icon = Image.open("mobile/assets/icon.png")
    img_favicon = img_icon.resize((48, 48), Image.Resampling.LANCZOS)
    img_favicon.save("mobile/assets/favicon.png", "PNG", optimize=True)

    # 6. Preview rendering docs/icon-preview.png (light and dark background preview)
    render_preview()

def render_preview():
    icon_img = Image.open("mobile/assets/icon.png").convert("RGBA")
    adaptive_fg = Image.open("mobile/assets/adaptive-icon.png").convert("RGBA")
    mono_fg = Image.open("mobile/assets/adaptive-icon-monochrome.png").convert("RGBA")

    # Preview Canvas: 1600 x 900
    W, H = 1600, 900
    preview = Image.new("RGBA", (W, H), (248, 250, 252, 255))
    draw = ImageDraw.Draw(preview)

    # Left panel (Light context, 800 wide)
    draw.rectangle([0, 0, 800, H], fill=(248, 250, 252, 255))
    # Right panel (Dark context, 800 wide)
    draw.rectangle([800, 0, W, H], fill=(15, 23, 42, 255)) # Slate 900

    # Draw divider
    draw.line([(800, 0), (800, H)], fill=(226, 232, 240, 255), width=2)

    def make_rounded_icon(base_img, size, radius=76):
        resized = base_img.resize((size, size), Image.Resampling.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
        rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        rounded.paste(resized, (0, 0), mask)
        return rounded

    def make_circle_icon(fg_img, bg_color, size):
        bg = Image.new("RGBA", (size, size), bg_color)
        resized_fg = fg_img.resize((size, size), Image.Resampling.LANCZOS)
        bg.paste(resized_fg, (0, 0), resized_fg)
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, size, size], fill=255)
        circle = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        circle.paste(bg, (0, 0), mask)
        return circle

    icon_large = make_rounded_icon(icon_img, 360, radius=80)
    icon_circle_light = make_circle_icon(adaptive_fg, (238, 242, 255, 255), 180)
    
    # In dark panel, show the store icon and also the themed monochrome adaptive icon!
    icon_large_dark = make_rounded_icon(icon_img, 360, radius=80)
    icon_circle_dark = make_circle_icon(adaptive_fg, (238, 242, 255, 255), 180)
    icon_circle_mono = make_circle_icon(mono_fg, (49, 46, 129, 255), 180) # Themed dark launcher

    # Place in Light Panel
    preview.paste(icon_large, (120, 200), icon_large)
    preview.paste(icon_circle_light, (530, 290), icon_circle_light)

    # Place in Dark Panel
    preview.paste(icon_large_dark, (920, 200), icon_large_dark)
    preview.paste(icon_circle_dark, (1330, 200), icon_circle_dark)
    preview.paste(icon_circle_mono, (1330, 420), icon_circle_mono)

    # Labels Light
    draw.text((120, 75), "Campaign Amplifier", fill=(15, 23, 42, 255), font_size=36)
    draw.text((120, 128), "Original Brand Mark - Light Context (App Store Squircle & Adaptive Circle)", fill=(100, 116, 139, 255), font_size=18)
    draw.text((120, 580), "App Store Icon (1024x1024)", fill=(71, 85, 105, 255), font_size=16)
    draw.text((530, 490), "Adaptive Launcher", fill=(71, 85, 105, 255), font_size=16)

    # Labels Dark
    draw.text((920, 75), "Campaign Amplifier", fill=(248, 250, 252, 255), font_size=36)
    draw.text((920, 128), "Original Brand Mark - Dark Context (Night Theme & Themed Icon)", fill=(148, 163, 184, 255), font_size=18)
    draw.text((920, 580), "App Store Icon (1024x1024)", fill=(203, 213, 225, 255), font_size=16)
    draw.text((1330, 390), "Adaptive Launcher", fill=(203, 213, 225, 255), font_size=14)
    draw.text((1330, 610), "Themed Monochrome", fill=(203, 213, 225, 255), font_size=14)

    # Bottom Legend
    draw.text((120, 800), "Brand Concept: Message amplification - acoustic energy arcs in our #4F46E5 indigo palette on clean canvas.", fill=(79, 70, 229, 255), font_size=18)

    preview.save("docs/icon-preview.png", "PNG", optimize=True)

if __name__ == "__main__":
    generate_assets()
    print("Refined brand assets generated successfully!")
