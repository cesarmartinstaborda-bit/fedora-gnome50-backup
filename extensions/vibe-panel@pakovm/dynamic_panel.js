import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class DynamicPanelHandler {
    constructor(settings, extension) {
        this._settings = settings;
        this._extension = extension;
        this._interfaceSettings = extension.getInterfaceSettings();
        this._currentTransparency = -1;
    }

    update() {
        if (!this._settings || !this._extension) return;

        const transparency = this._settings.get_int('transparency');
        const enableTransparency = this._settings.get_boolean('enable-transparency');
        const inOverview = Main.panel.has_style_pseudo_class('overview');
        // Get the final truth from the central governor.
        let finalTransparency;
        if (inOverview) {
            finalTransparency = 0;
        } else if (!enableTransparency) {
            finalTransparency = 100;
        } else {
            finalTransparency = transparency;
        }

        // --- Robust "Always Update" Logic ---
        // Unconditionally remove all managed classes first to prevent race conditions.
        if (this._currentTransparency !== -1) {
            const oldClass = `dynamic-panel-transparency-${this._currentTransparency}`;
            Main.panel.remove_style_class_name(oldClass);
        }
        Main.panel.remove_style_class_name('dynamic-panel-light');
        Main.panel.remove_style_class_name('dynamic-panel-dark');

        // Now, apply the correct new classes from a clean slate.
        Main.panel.add_style_class_name('dynamic-panel-transparent');
        const newClass = `dynamic-panel-transparency-${finalTransparency}`;
        Main.panel.add_style_class_name(newClass);

        const colorScheme = this._interfaceSettings.get_string('color-scheme');
        if (colorScheme === 'prefer-light') {
            Main.panel.add_style_class_name('dynamic-panel-light');
        } else {
            Main.panel.add_style_class_name('dynamic-panel-dark');
        }

        // --- Accent Color Tint ---
        // Keep the tint class even in overview so CSS transitions can handle
        // the color change smoothly.
        const accentTint = this._settings.get_boolean('accent-color-tint');
        if (accentTint) {
            Main.panel.add_style_class_name('dynamic-panel-accent-tint');
        } else {
            Main.panel.remove_style_class_name('dynamic-panel-accent-tint');
        }

        this._currentTransparency = finalTransparency;
    }

    disable() {
        if (this._currentTransparency !== -1) {
            const oldClass = `dynamic-panel-transparency-${this._currentTransparency}`;
            Main.panel.remove_style_class_name(oldClass);
        }
        Main.panel.remove_style_class_name('dynamic-panel-transparent');
        Main.panel.remove_style_class_name('dynamic-panel-light');
        Main.panel.remove_style_class_name('dynamic-panel-dark');
        Main.panel.remove_style_class_name('dynamic-panel-accent-tint');

        this._settings = null;
        this._extension = null;
        this._interfaceSettings = null;
    }
}

