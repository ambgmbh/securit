# Available Options:

XPDEV_LIB		=	$(XPDEV_SRC)$(DIRSEP)$(LIBODIR)$(DIRSEP)$(LIBPREFIX)xpdev$(LIBFILE)
XPDEV-MT_LIB		=	$(XPDEV_SRC)$(DIRSEP)$(LIBODIR)$(DIRSEP)$(LIBPREFIX)xpdev_mt$(LIBFILE)

XPDEV_CFLAGS	=	-I$(XPDEV_SRC)
XPDEV_LDFLAGS	=	-L$(XPDEV_SRC)$(DIRSEP)$(LIBODIR)
XPDEV-MT_CFLAGS	=	$(XPDEV_CFLAGS)
XPDEV-MT_LDFLAGS=	$(XPDEV_LDFLAGS)
XPDEV_LIBS	=	-lxpdev
XPDEV-MT_LIBS	=	-lxpdev_mt
