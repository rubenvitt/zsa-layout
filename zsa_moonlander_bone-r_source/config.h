#undef TAPPING_TERM
#define TAPPING_TERM 300
#define PERMISSIVE_HOLD

#undef RGB_MATRIX_TIMEOUT
#define RGB_MATRIX_TIMEOUT 120000

#define USB_SUSPEND_WAKEUP_DELAY 0
#undef MOUSEKEY_WHEEL_INTERVAL
#define MOUSEKEY_WHEEL_INTERVAL 115

#define AUTO_SHIFT_TIMEOUT 135
#define NO_AUTO_SHIFT_TAB
#define CAPS_LOCK_STATUS
#define SERIAL_NUMBER "pzg9d/B4PNwW"
#define LAYER_STATE_8BIT
#define HCS(report) host_consumer_send(record->event.pressed ? report : 0); return false

#define RGB_MATRIX_STARTUP_SPD 60

