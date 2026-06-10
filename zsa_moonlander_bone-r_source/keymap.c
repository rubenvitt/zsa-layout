#include QMK_KEYBOARD_H
#include "version.h"
#include "i18n.h"
#define MOON_LED_LEVEL LED_LEVEL
#ifndef ZSA_SAFE_RANGE
#define ZSA_SAFE_RANGE SAFE_RANGE
#endif

enum custom_keycodes {
  RGB_SLD = ZSA_SAFE_RANGE,
  MAC_SIRI,
  MAC_LOCK,
};



// Tap/Hold-Taste fuer Winkelklammern: Tap = '<', Hold = '>'.
// Der LT(...) dient nur dazu, dass QMK die Tap/Hold-Aufloesung macht
// (record->tap.count). Layer 6 existiert nicht und wird nie aktiviert,
// weil process_record_user unten mit `return false` abbricht.
#define TH_LTGT LT(6, KC_F14)

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  [0] = LAYOUT_moonlander(
    MO(3),          KC_1,           KC_2,           KC_3,           KC_4,           KC_5,           LGUI(LSFT(KC_4)),                                LGUI(LSFT(KC_5)),KC_6,           KC_7,           KC_8,           KC_9,           KC_0,           LT(2, KC_BSPC),
    MO(4),          KC_J,           KC_D,           KC_U,           KC_A,           KC_X,           KC_DELETE,                                      KC_BSPC,        KC_P,           KC_H,           KC_L,           KC_M,           KC_W,           DE_SS,          
    MO(2),          KC_C,           KC_T,           KC_I,           KC_E,           KC_O,           KC_ESCAPE,                                                                      TG(1),          KC_B,           KC_N,           KC_R,           KC_S,           KC_G,           KC_Q,           
    KC_TAB,         KC_F,           KC_V,           DE_UE,          DE_AE,          DE_OE,                                          DE_Y,           DE_Z,           KC_COMMA,       KC_DOT,         KC_UP,          KC_K,           
    KC_LEFT_SHIFT,  LGUI(KC_SPACE), KC_LEFT_CTRL,   KC_LEFT_ALT,    KC_LEFT_GUI,    KC_CAPS,                                                                                                        TG(4),          KC_BSPC,        KC_RIGHT_GUI,   KC_LEFT,        KC_DOWN,        KC_RIGHT,       
    KC_ENTER,       MO(3),          MO(5),                          MAC_SIRI,       KC_RIGHT_ALT,   KC_SPACE
  ),
  [1] = LAYOUT_moonlander(
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT,                                 KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, 
    KC_TRANSPARENT, KC_Q,           KC_W,           KC_E,           KC_R,           KC_T,           KC_F3,                                          KC_F3,          DE_Z,           KC_U,           KC_I,           KC_O,           KC_P,           DE_UE,          
    KC_TRANSPARENT, KC_A,           KC_S,           KC_D,           KC_F,           KC_G,           KC_TRANSPARENT,                                                                 KC_TRANSPARENT, KC_H,           KC_J,           KC_K,           KC_L,           DE_OE,          KC_TRANSPARENT, 
    KC_TRANSPARENT, DE_Y,           KC_X,           KC_C,           KC_V,           KC_B,                                           KC_N,           KC_M,           KC_COMMA,       KC_DOT,         DE_MINS,        KC_TRANSPARENT, 
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT,                                                                                                 KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, 
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT,                 KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT
  ),
  [2] = LAYOUT_moonlander(
    KC_TRANSPARENT, KC_F1,          KC_F2,          KC_F3,          KC_F4,          KC_F5,          KC_TRANSPARENT,                                 KC_TRANSPARENT, KC_F6,          KC_F7,          KC_F8,          KC_F9,          KC_F10,         KC_TRANSPARENT, 
    LALT(KC_L),     LALT(KC_DOT),   DE_UNDS,        LALT(KC_5),     LALT(KC_6),     TH_LTGT,    KC_TRANSPARENT,                                 KC_TRANSPARENT, DE_EXLM,        DE_CIRC,        LSFT(DE_CIRC),  DE_EQL,         DE_AMPR,        DE_AT,          
    KC_TRANSPARENT, LALT(LSFT(KC_7)),DE_SLSH,        LALT(KC_8),     LALT(KC_9),     DE_ASTR,        KC_TRANSPARENT,                                                                 KC_TRANSPARENT, DE_QST,         DE_LPRN,        DE_RPRN,        DE_MINS,        DE_COLN,        KC_TRANSPARENT, 
    KC_TRANSPARENT, DE_HASH,        DE_DLR,         LALT(KC_7),     LALT(KC_N),     DE_GRV,                                         DE_PLUS,        DE_PERC,        DE_DQOT,        DE_QUOT,        DE_SCLN,        DE_EURO,        
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT,                                                                                                 KC_TRANSPARENT, KC_TRANSPARENT, KC_F12,         KC_F13,         KC_F14,         KC_F15,         
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT,                 KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT
  ),
  [3] = LAYOUT_moonlander(
    KC_TRANSPARENT, LGUI(LSFT(KC_SPACE)),KC_NO,          KC_NO,          KC_NO,          KC_NO,          KC_TRANSPARENT,                                 KC_TRANSPARENT, KC_NO,          KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_NO,          KC_TRANSPARENT, 
    MAC_LOCK,       KC_PAGE_UP,     KC_BSPC,        KC_UP,          KC_DELETE,      KC_PGDN,        KC_TRANSPARENT,                                 KC_TRANSPARENT, KC_NO,          KC_7,           KC_8,           KC_9,           DE_PLUS,        DE_MINS,        
    KC_TRANSPARENT, KC_HOME,        KC_LEFT,        KC_DOWN,        KC_RIGHT,       KC_END,         KC_TRANSPARENT,                                                                 KC_TRANSPARENT, KC_NO,          KC_4,           KC_5,           KC_6,           DE_ASTR,        DE_SLSH,        
    KC_TRANSPARENT, LGUI(LSFT(DE_Z)),KC_MAC_CUT,     KC_MAC_COPY,    KC_MAC_PASTE,   LCTL(DE_Z),                                     KC_0,           KC_1,           KC_2,           KC_3,           KC_NO,          KC_TRANSPARENT, 
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT,                                                                                                 KC_TRANSPARENT, KC_TRANSPARENT, KC_0,           KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, 
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT,                 KC_TRANSPARENT, KC_ESCAPE,      KC_TRANSPARENT
  ),
  [4] = LAYOUT_moonlander(
    KC_TRANSPARENT, KC_AUDIO_MUTE,  KC_AUDIO_VOL_DOWN,KC_AUDIO_VOL_UP,KC_BRIGHTNESS_DOWN,KC_BRIGHTNESS_UP,KC_TRANSPARENT,                                 KC_TRANSPARENT, KC_TRANSPARENT, RGB_VAI,        KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, QK_BOOT,        
    KC_TRANSPARENT, KC_TRANSPARENT, KC_MS_BTN2,     KC_MS_UP,       KC_MS_BTN1,     KC_TRANSPARENT, KC_TRANSPARENT,                                 KC_TRANSPARENT, KC_TRANSPARENT, RGB_VAD,        KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, 
    MU_NEXT,        KC_TRANSPARENT, KC_MS_LEFT,     KC_MS_DOWN,     KC_MS_RIGHT,    KC_TRANSPARENT, KC_TRANSPARENT,                                                                 AS_TOGG,        KC_TRANSPARENT, KC_MS_BTN1,     KC_MS_BTN2,     KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, 
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_MS_WH_DOWN,  KC_MS_BTN3,     KC_TRANSPARENT,                                 KC_TRANSPARENT, KC_MEDIA_PREV_TRACK,KC_MEDIA_PLAY_PAUSE,KC_MEDIA_NEXT_TRACK,KC_TRANSPARENT, KC_TRANSPARENT, 
    KC_TRANSPARENT, KC_TRANSPARENT, KC_MS_WH_LEFT,  KC_MS_WH_UP,    KC_MS_WH_RIGHT, KC_TRANSPARENT,                                                                                                 KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, 
    KC_MEDIA_PLAY_PAUSE,KC_TRANSPARENT, KC_TRANSPARENT,                 KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT
  ),
  [5] = LAYOUT_moonlander(
    KC_TRANSPARENT, KC_NO,          KC_NO,          KC_NO,          KC_NO,          KC_NO,          KC_NO,                                          KC_NO,          KC_NO,          KC_NO,          KC_NO,          KC_NO,          KC_NO,          KC_TRANSPARENT, 
    KC_TRANSPARENT, KC_NO,          LALT(LCTL(LSFT(KC_L))),LCTL(KC_Q),     LCTL(LSFT(KC_KP_SLASH)),LCTL(KC_KP_SLASH),KC_NO,                                          KC_NO,          KC_NO,          LCTL(DE_Y),     LALT(LSFT(KC_UP)),LCTL(LSFT(KC_UP)),LALT(LCTL(KC_T)),KC_TRANSPARENT, 
    KC_TRANSPARENT, LALT(LGUI(LSFT(KC_J))),LALT(LSFT(KC_L)),LCTL(LSFT(KC_I)),LSFT(KC_F9),    LSFT(KC_F10),   LCTL(LSFT(KC_F9)),                                                                KC_NO,          KC_NO,          LCTL(KC_D),     LALT(LSFT(KC_DOWN)),LCTL(LSFT(KC_DOWN)),LCTL(LSFT(KC_DELETE)),LCTL(LSFT(KC_ENTER)),
    KC_TRANSPARENT, KC_NO,          LALT(LCTL(LSFT(KC_T))),LALT(LCTL(KC_M)),LALT(LSFT(KC_V)),LSFT(KC_F6),                                    KC_NO,          LCTL(LSFT(KC_W)),LCTL(KC_W),     LALT(KC_J),     LALT(LSFT(KC_J)),LALT(LCTL(LSFT(KC_J))),
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT,                                                                                                 KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT, 
    KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT,                 KC_TRANSPARENT, KC_TRANSPARENT, KC_TRANSPARENT
  ),
};




bool capslock_active = false;

bool led_update_user(led_t led_state) {
  capslock_active = led_state.caps_lock;
  return true;
}

extern rgb_config_t rgb_matrix_config;

RGB hsv_to_rgb_with_value(HSV hsv) {
  RGB rgb = hsv_to_rgb( hsv );
  float f = (float)rgb_matrix_config.hsv.v / UINT8_MAX;
  return (RGB){ f * rgb.r, f * rgb.g, f * rgb.b };
}

void keyboard_post_init_user(void) {
  rgb_matrix_enable();
}

const uint8_t PROGMEM ledmap[][RGB_MATRIX_LED_COUNT][3] = {
    [0] = { {11,255,255}, {11,255,255}, {11,255,255}, {11,255,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {150,225,255}, {11,255,255}, {11,255,255}, {11,255,255}, {11,255,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {11,255,255}, {11,255,255}, {11,255,255}, {11,255,255}, {0,0,255}, {0,0,255}, {0,0,255}, {171,255,255} },

    [1] = { {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {171,131,255}, {171,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {171,255,255}, {171,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {171,131,255}, {171,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {171,131,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {171,131,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {171,255,255}, {171,255,255}, {171,255,255}, {171,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {171,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {171,255,255}, {171,255,255}, {171,255,255}, {171,255,255} },

    [2] = { {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {43,255,255}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {43,255,136}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {221,255,255} },

    [3] = { {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,218,204}, {0,0,0}, {0,0,0}, {0,0,0}, {14,255,255}, {86,218,188}, {0,0,0}, {0,0,0}, {14,255,255}, {14,255,255}, {86,218,188}, {0,0,0}, {0,0,0}, {0,0,0}, {14,255,255}, {86,218,188}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,218,204}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {11,255,255}, {36,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {86,192,205}, {150,225,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,255}, {0,0,0}, {0,0,255}, {0,0,0}, {0,0,0}, {0,0,255}, {0,0,255}, {0,0,255}, {0,0,255}, {0,0,0}, {0,0,255}, {0,0,255}, {0,0,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0} },

    [4] = { {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {36,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,218,204}, {150,225,255}, {105,255,255}, {0,0,0}, {150,225,255}, {86,255,170}, {105,255,255}, {105,255,255}, {150,225,255}, {150,225,255}, {0,218,204}, {150,225,255}, {105,255,255}, {0,0,0}, {150,225,255}, {86,255,170}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,218,204}, {0,0,0}, {0,0,0}, {0,0,0}, {150,225,255}, {0,218,204}, {0,0,0}, {0,0,255}, {0,218,204}, {150,225,255}, {0,218,204}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0}, {36,255,255}, {0,0,0}, {0,0,0}, {0,0,0}, {0,0,0} },

    [5] = { {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,255}, {0,0,62}, {0,0,62}, {0,0,62}, {64,207,193}, {64,207,193}, {64,207,193}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {64,207,193}, {0,0,62}, {0,0,62}, {0,0,181}, {67,207,193}, {64,207,193}, {0,0,62}, {0,0,62}, {0,0,181}, {67,207,193}, {64,207,193}, {0,0,62}, {0,0,62}, {67,207,150}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {139,222,204}, {139,222,204}, {0,0,62}, {0,0,62}, {64,207,193}, {64,207,193}, {139,222,204}, {0,0,62}, {0,0,62}, {26,207,193}, {26,207,193}, {139,222,204}, {0,0,62}, {0,0,62}, {26,207,193}, {26,207,193}, {139,222,204}, {0,0,62}, {0,0,62}, {0,209,201}, {139,222,204}, {139,222,204}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62}, {0,0,62} },

};

void set_layer_color(int layer) {
  for (int i = 0; i < RGB_MATRIX_LED_COUNT; i++) {
    HSV hsv = {
      .h = pgm_read_byte(&ledmap[layer][i][0]),
      .s = pgm_read_byte(&ledmap[layer][i][1]),
      .v = pgm_read_byte(&ledmap[layer][i][2]),
    };
    if (!hsv.h && !hsv.s && !hsv.v) {
        rgb_matrix_set_color( i, 0, 0, 0 );
    } else {
        RGB rgb = hsv_to_rgb_with_value(hsv);
        rgb_matrix_set_color(i, rgb.r, rgb.g, rgb.b);
    }
  }
}

bool rgb_matrix_indicators_user(void) {
  if (rawhid_state.rgb_control) {
      return false;
  }
  if (!keyboard_config.disable_layer_led) { 
    switch (biton32(layer_state)) {
      case 0:
        set_layer_color(0);
        break;
      case 1:
        set_layer_color(1);
        break;
      case 2:
        set_layer_color(2);
        break;
      case 3:
        set_layer_color(3);
        break;
      case 4:
        set_layer_color(4);
        break;
      case 5:
        set_layer_color(5);
        break;
     default:
        if (rgb_matrix_get_flags() == LED_FLAG_NONE) {
          rgb_matrix_set_color_all(0, 0, 0);
        }
    }
  } else {
    if (rgb_matrix_get_flags() == LED_FLAG_NONE) {
      rgb_matrix_set_color_all(0, 0, 0);
    }
  }

  if (capslock_active && biton32(layer_state) == 0) {
    RGB rgb = hsv_to_rgb_with_value((HSV) { 0, 255, 255 });
    rgb_matrix_set_color( 35, rgb.r, rgb.g, rgb.b );
  } 
  return true;
}





bool process_record_user(uint16_t keycode, keyrecord_t *record) {
  switch (keycode) {
    case MAC_SIRI:
      HCS(0xCF);
    case MAC_LOCK:
      HCS(0x19E);

    case TH_LTGT:
      if (record->tap.count > 0) {
        if (record->event.pressed) {
          register_code16(DE_LESS);
        } else {
          unregister_code16(DE_LESS);
        }
      } else {
        if (record->event.pressed) {
          register_code16(DE_MORE);
        } else {
          unregister_code16(DE_MORE);
        }  
      }  
      return false;
    case RGB_SLD:
        if (rawhid_state.rgb_control) {
            return false;
        }
        if (record->event.pressed) {
            rgblight_mode(1);
        }
        return false;
  }
  return true;
}

