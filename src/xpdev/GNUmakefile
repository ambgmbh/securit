SRC_ROOT	?=	..
include $(SRC_ROOT)/build/Common.gmake

ifdef XP_SEM
	MTOBJS	+=	$(MTOBJODIR)$(DIRSEP)xpsem$(OFILE)
endif
ifneq ($(os),win32)
 MTOBJS	+=	$(MTOBJODIR)$(DIRSEP)xpevent$(OFILE)
endif

ifndef NO_PULSEAUDIO
 ifeq ($(shell command -v pkg-config > /dev/null && pkg-config --exists libpulse-simple && echo 'YES'),YES)
  CFLAGS += -DWITH_PULSEAUDIO `pkg-config libpulse-simple --cflags`
  MT_CFLAGS += -DWITH_PULSEAUDIO `pkg-config libpulse-simple --cflags`
 endif
endif

CFLAGS	+=	-DSOUNDCARD_H_IN=$(shell if [ -f /usr/include/sys/soundcard.h ] ; then echo 1 ; elif [ -f /usr/include/soundcard.h ] ; then echo 2 ; elif [ -f /usr/include/linux/soundcard.h ] ; then echo 3 ; else echo 0 ; fi) -I. $(XPDEV_CFLAGS)
ifndef WITHOUT_ALSA_SOUND
	ifeq ($(shell if [ -f /usr/include/alsa/asoundlib.h ] ; then echo YES ; fi),YES)
		CFLAGS	+=	-DUSE_ALSA_SOUND
	endif
endif
MT_CFLAGS	+=	$(XPDEV-MT_CFLAGS)

ifdef WITH_SDL_AUDIO
 MTOBJS	+=	$(MTOBJODIR)$(DIRSEP)sdlfuncs$(OFILE)
 OBJS	+=	$(OBJODIR)$(DIRSEP)sdlfuncs$(OFILE)
endif

# Executable Build Rule
$(WRAPTEST): $(MTOBJODIR)/wraptest.o $(DEPS)
	@echo Linking $@
	$(QUIET)$(CC) -o $@ $(LDFLAGS) $(MT_LDFLAGS) $^ $(XPDEV-MT_LIB_BUILD) -lm

$(XPTIME): $(OBJODIR)/xptime.o $(XPDEV_LIB_BUILD)
	@echo Linking $@
	$(QUIET)$(CC) -o $@ $(LDFLAGS) $^ $(XPDEV_LIB_BUILD)

$(XPDEV_LIB_BUILD): $(OBJODIR) $(OBJS)
	@echo Creating $@
	$(QUIET)$(AR) rc $@ $(OBJS)
	$(QUIET)$(RANLIB) $@

$(XPDEV_SHLIB_BUILD): $(OBJODIR) $(OBJS)
	@echo Creating $@
	$(QUIET)$(MKSHLIB) $(LDFLAGS) $(OBJS) $(SHLIBOPTS) -o $@

$(XPDEV-MT_LIB_BUILD): $(MTOBJODIR) $(MTOBJS)
	@echo Creating $@
	$(QUIET)$(AR) rc $@ $(MTOBJS)
	$(QUIET)$(RANLIB) $@

$(XPDEV-MT_SHLIB_BUILD): $(MTOBJODIR) $(MTOBJS)
	@echo Creating $@
	$(QUIET)$(MKSHLIB) $(LDFLAGS) $(MTOBJS) $(SHLIBOPTS) -o $@

