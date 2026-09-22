include $(TOPDIR)/rules.mk

PKG_VERSION:=2.0.3
PKG_RELEASE:=1

LUCI_TITLE:=LuCI support for Dr.COM campus authentication
LUCI_DEPENDS:=+curl +ca-bundle +rpcd +luci-base
LUCI_PKGARCH:=all

PKG_MAINTAINER:=OpenAI Codex
PKG_LICENSE:=MIT

define Package/luci-app-campusauth/conffiles
/etc/config/campusauth
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
