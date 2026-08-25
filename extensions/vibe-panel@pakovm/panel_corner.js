import Clutter from 'gi://Clutter';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Cairo from 'cairo';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { ANIMATION_TIME } from 'resource:///org/gnome/shell/ui/overview.js';

const SYNC_CREATE = GObject.BindingFlags.SYNC_CREATE;

export class PanelCorners {
    #settings;
    #connections;
    #extension;
    _leftCorner;
    _rightCorner;

    constructor(settings, connections, extension) {
        this.#settings = settings;
        this.#connections = connections;
        this.#extension = extension;
    }

    update() {
        this.remove();

        this._leftCorner = new PanelCorner(St.Side.LEFT, this.#settings, this.#extension);
        this._rightCorner = new PanelCorner(St.Side.RIGHT, this.#settings, this.#extension);

        this.update_corner(this._leftCorner);
        this.update_corner(this._rightCorner);
    }

    update_corner(corner) {
        Main.panel.bind_property('style', corner, 'style', SYNC_CREATE);
        Main.panel.add_child(corner);
        corner.syncPanelState();

        const actor = (this.#settings.settings);

        // Re-render corners when any extension setting changes
        this.#settings.keys.forEach(key => {
            this.#connections.connect(
                actor,
                'changed::' + key.name,
                corner.syncPanelState.bind(corner)
            );
        });
    }

    updateOpacity() {
        this._leftCorner?.syncPanelState();
        this._rightCorner?.syncPanelState();
    }

    remove() {
        this.#connections.disconnect_all();

        if (this._leftCorner) {
            this.remove_corner(this._leftCorner);
            this._leftCorner = null;
        }

        if (this._rightCorner) {
            this.remove_corner(this._rightCorner);
            this._rightCorner = null;
        }
    }

    remove_corner(corner) {
        corner.remove_connections();
        Main.panel.remove_child(corner);
        corner.destroy();
    }
}


export class PanelCorner extends St.DrawingArea {
    static {
        GObject.registerClass({
            Properties: {
                'color-r': GObject.ParamSpec.double('color-r', 'color-r', 'color-r', GObject.ParamFlags.READWRITE, 0, 255, 0),
                'color-g': GObject.ParamSpec.double('color-g', 'color-g', 'color-g', GObject.ParamFlags.READWRITE, 0, 255, 0),
                'color-b': GObject.ParamSpec.double('color-b', 'color-b', 'color-b', GObject.ParamFlags.READWRITE, 0, 255, 0),
            },
        }, this);
    }

    // By explicitly defining getters/setters, Clutter's ease() function will automatically
    // trigger queue_repaint() on every single frame of the animation.
    get color_r() { return this._color_r || 0; }
    set color_r(v) { this._color_r = v; this.queue_repaint(); }

    get color_g() { return this._color_g || 0; }
    set color_g(v) { this._color_g = v; this.queue_repaint(); }

    get color_b() { return this._color_b || 0; }
    set color_b(v) { this._color_b = v; this.queue_repaint(); }

    #side;
    #settings;
    #extension;

    #position_changed_id;
    #size_changed_id;
    #panel_style_changed_id;

    constructor(side, settings, extension) {
        super({ style_class: 'panel-corner' });

        this.#side = side;
        this.#settings = settings;
        this.#extension = extension;

        this.#position_changed_id = Main.panel.connect(
            'notify::position',
            this.#update_allocation.bind(this)
        );
        this.#size_changed_id = Main.panel.connect(
            'notify::size',
            this.#update_allocation.bind(this)
        );
        // CRITICAL FIX: Listen to the panel's style changes, not just our own
        this.#panel_style_changed_id = Main.panel.connect(
            'style-changed',
            this.syncPanelState.bind(this)
        );

        this.#update_allocation();

        // Initialize interpolation properties to current panel color
        const color = this._getCornerColor();
        this.color_r = color.red;
        this.color_g = color.green;
        this.color_b = color.blue;
    }

    remove_connections() {
        if (this.#position_changed_id) {
            Main.panel.disconnect(this.#position_changed_id);
            this.#position_changed_id = null;
        }
        if (this.#size_changed_id) {
            Main.panel.disconnect(this.#size_changed_id);
            this.#size_changed_id = null;
        }
        if (this.#panel_style_changed_id) {
            Main.panel.disconnect(this.#panel_style_changed_id);
            this.#panel_style_changed_id = null;
        }
    }

    #update_allocation() {
        let childBox = new Clutter.ActorBox();

        let cornerWidth, cornerHeight;
        [, cornerWidth] = this.get_preferred_width(-1);
        [, cornerHeight] = this.get_preferred_height(-1);

        let allocWidth = Main.panel.width;
        let allocHeight = Main.panel.height;

        switch (this.#side) {
            case St.Side.LEFT:
                childBox.x1 = 0;
                childBox.x2 = cornerWidth;
                childBox.y1 = allocHeight;
                childBox.y2 = allocHeight + cornerHeight;
                break;

            case St.Side.RIGHT:
                childBox.x1 = allocWidth - cornerWidth;
                childBox.x2 = allocWidth;
                childBox.y1 = allocHeight;
                childBox.y2 = allocHeight + cornerHeight;
                break;
        }

        this.allocate(childBox);
    }

    _getCornerColor() {
        const themeNode = Main.panel.get_theme_node();
        return themeNode.get_background_color();
    }

    _getCornerBorderWidth() {
        let scale_factor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        let length = this.#settings.get_property('panel-corner-border-width').get();
        return length * scale_factor;
    }

    syncPanelState() {
        const cornerRadius = 15;
        let borderWidth = this._getCornerBorderWidth();

        let targetOpacity;
        const panelNode = Main.panel.get_theme_node();
        const backgroundColor = panelNode.get_background_color();

        if (Main.panel.has_style_pseudo_class('overview')) {
            targetOpacity = 0.0;
        } else if (this.#extension.isWindowMaximized()) {
            targetOpacity = 255.0; // Clutter opacity is 0-255
        } else {
            targetOpacity = backgroundColor.alpha;
        }

        // CRITICAL FIX: If the panel is fading out to completely transparent, lock the current RGB values.
        // This prevents the accent color from turning "black" during the fade-out animation.
        let targetR = backgroundColor.alpha === 0 ? this.color_r : backgroundColor.red;
        let targetG = backgroundColor.alpha === 0 ? this.color_g : backgroundColor.green;
        let targetB = backgroundColor.alpha === 0 ? this.color_b : backgroundColor.blue;

        this.#update_allocation();
        this.set_size(cornerRadius, borderWidth + cornerRadius);
        this.translation_y = -borderWidth;

        this.remove_transition('opacity');
        this.remove_transition('color-r');
        this.remove_transition('color-g');
        this.remove_transition('color-b');

        const duration = panelNode.get_transition_duration() || ANIMATION_TIME;

        this.ease({
            opacity: targetOpacity,
            'color-r': targetR,
            'color-g': targetG,
            'color-b': targetB,
            duration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
        });
    }

    vfunc_style_changed() {
        super.vfunc_style_changed();
        // If our own style changes, we still sync with the panel
        this.syncPanelState();
    }

    vfunc_repaint() {
        const cornerRadius = 15;
        let borderWidth = this._getCornerBorderWidth();

        let cr = this.get_context();
        cr.setOperator(Cairo.Operator.SOURCE);

        cr.moveTo(0, 0);
        if (this.#side == St.Side.LEFT) {
            cr.arc(cornerRadius,
                borderWidth + cornerRadius,
                cornerRadius, Math.PI, 3 * Math.PI / 2);
        } else {
            cr.arc(0,
                borderWidth + cornerRadius,
                cornerRadius, 3 * Math.PI / 2, 2 * Math.PI);
        }
        cr.lineTo(cornerRadius, 0);
        cr.closePath();

        // Paint with alpha=1.0. Clutter's opacity property handles transparency natively.
        cr.setSourceRGBA(
            this.color_r / 255,
            this.color_g / 255,
            this.color_b / 255,
            1.0
        );
        cr.fill();

        cr.$dispose();
    }
}
