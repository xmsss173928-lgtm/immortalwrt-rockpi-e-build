# luci-app-campusauth

Modern LuCI app for Dr.COM campus authentication, targeting ImmortalWrt
24.10.6 on the Radxa ROCK Pi E.

## Features

- UCI-managed server, username, password and protocol parameters
- procd service with boot enable, respawn and reload trigger
- Real authentication status polling with configurable interval
- Immediate re-login with configurable backoff
- Safe request timeouts
- Manual login/resume and logout/pause
- UA2F service status using the init script first and process matching as fallback
- Modern LuCI JavaScript view, rpcd ACL and menu integration
- Volatile syslog only; no flash log writes

No credentials are included.

## Add to an ImmortalWrt source tree

Copy the luci-app-campusauth directory to:

    package/luci-app-campusauth

Then run:

    make menuconfig

Select:

    LuCI -> Applications -> luci-app-campusauth

Or add:

    CONFIG_PACKAGE_luci-app-campusauth=y

Run make defconfig, verify the selection, and build normally.

## First setup

Open Services -> Campus Authentication, set the Dr.COM server, username and
password, enable automatic authentication, then Save & Apply.
