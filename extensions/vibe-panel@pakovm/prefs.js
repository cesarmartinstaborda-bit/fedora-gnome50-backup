import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { Settings, Type } from './conveniences/settings.js';

// This list must contain ALL keys from the schema to prevent errors.
const Keys = ([
    { type: Type.B, name: "panel-corners" },
    { type: Type.I, name: "panel-corner-border-width" },
    { type: Type.B, name: "enable-transparency" },
    { type: Type.I, name: "transparency" },
    { type: Type.I, name: "last-used-transparency" },
    { type: Type.B, name: "disable-corners-on-light-theme" },
    { type: Type.B, name: "accent-color-tint" },
]);

const INTERFACE_SCHEMA = 'org.gnome.desktop.interface';

export default class VibePanelPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        this.settings = new Settings(Keys, this.getSettings());
        this._interfaceSettings = new Gio.Settings({ schema: INTERFACE_SCHEMA });

        const PRESET_MAP = [
            { name: _('0%'), value: 0 },
            { name: _('30%'), value: 30 },
            { name: _('50%'), value: 50 },
            { name: _('70%'), value: 70 },
            { name: _('85%'), value: 85 },
        ];
        const PRESET_LABELS = PRESET_MAP.map(item => item.name);
        const PRESET_VALUES = PRESET_MAP.map(item => item.value);

        const page = new Adw.PreferencesPage();
        window.add(page);

        // --- Look & feel Group ---
        const mainGroup = new Adw.PreferencesGroup({ title: _('Look & feel') });
        page.add(mainGroup);

        const accentTintSwitch = new Adw.SwitchRow({
            title: _('Accent Color Tint'),
            subtitle: _('Tints the panel and corners with the system accent color.'),
        });
        mainGroup.add(accentTintSwitch);

        const enableTransparencySwitch = new Adw.SwitchRow({
            title: _('Enable Transparency'),
            subtitle: _('Make the panel transparent when no window is maximized.'),
        });
        mainGroup.add(enableTransparencySwitch);

        const transparencyRow = new Adw.ComboRow({
            title: _('Opacity level'),
            model: Gtk.StringList.new(PRESET_LABELS),
        });
        mainGroup.add(transparencyRow);

        const cornersSwitch = new Adw.SwitchRow({ title: _('Enable Panel Corners') });
        mainGroup.add(cornersSwitch);

        const disableCornersLightSwitch = new Adw.SwitchRow({
            title: _('Disable corners in Light mode'),
            subtitle: _('You need <a href="https://extensions.gnome.org/extension/6750/luminus-desktop/">Luminus Shell</a> for these option to take effect.'),
        });
        mainGroup.add(disableCornersLightSwitch);


        // --- UI Logic ---
        const updateUI = () => {
            const areCornersEnabled = this.settings.PANEL_CORNERS.get();
            const isTransparencyEnabled = this.settings.ENABLE_TRANSPARENCY.get();

            cornersSwitch.active = areCornersEnabled;
            disableCornersLightSwitch.visible = areCornersEnabled;
            transparencyRow.visible = isTransparencyEnabled;

            transparencyRow.selected = PRESET_VALUES.indexOf(this.settings.LAST_USED_TRANSPARENCY.get());
        };

        transparencyRow.connect('notify::selected', () => {
            const newValue = PRESET_VALUES[transparencyRow.selected];
            this.settings.LAST_USED_TRANSPARENCY.set(newValue);
            this.settings.TRANSPARENCY.set(newValue);
        });

        this.settings.settings.bind('accent-color-tint', accentTintSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.settings.settings.bind('enable-transparency', enableTransparencySwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.settings.settings.bind('panel-corners', cornersSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.settings.settings.bind('disable-corners-on-light-theme', disableCornersLightSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        this.settings.TRANSPARENCY.changed(updateUI);
        this.settings.PANEL_CORNERS.changed(updateUI);
        this.settings.ENABLE_TRANSPARENCY.changed(updateUI);

        updateUI();
    }
}
