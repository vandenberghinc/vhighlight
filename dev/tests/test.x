
// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Daemon type.

/* 	@docs
	@chapter: System
	@title: Daemon
	@description:
		Daemon type.
    @usage:
        #include <vlib/types.h>
        vlib::Daemon daemon ({ ... });
*/
struct Daemon {
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Assign the daemon path.
	void 	assign_path() {
        #if OSID == 0
            String x ("/etc/systemd/system/");
            x << m_settings.name;
            x << ".service";
            m_path = x;
        #elif OSID == 0
            String x ("/Library/LaunchDaemons/");
            x << m_settings.name;
            x << ".plist";
            m_path = x;
        #else
            throw OSError(to_str("Operating system \"MacOS\" is not yet supported."));
        #endif
	}
	
	// Create the daemon config.
	#if OSID == 0
	constexpr
	String 	create_h() {
		
		// Default.
		String data;
		data <<
		"[Unit]" << "\n" <<
		"Description=" << m_settings.desc << "\n" <<
		"After=network.target" << "\n" <<
		"StartLimitIntervalSec=0" << "\n" <<
		"" << "\n" <<
        
		"[Service]" << "\n" <<
        "User=" << m_settings.user << "\n" <<
		"Type=simple" << "\n" <<
		"ExecStart=" << m_settings.command << " ";
		for (auto& i: m_settings.args) {
			data << "\"" << i << "\" ";
		}
        data << "\n";
        for (auto& index: m_settings.env.indexes()) {
            data << "Environment=\"" << m_settings.env.key(index) << "=" << m_settings.env.value(index) << "\"\n";
        }

		# /* Group.*/
		if (m_settings.group.is_defined()) {
			data <<
			"Group=" << m_settings.group << "\n";
		}

		// Restart.
		if (m_settings.auto_restart) {
			data <<
			"Restart=always" << "\n" <<
			"RestartSec=1" << "\n" <<
			"";
			if (m_settings.auto_restart_limit != -1) {
				data <<
				"StartLimitBurst=" << m_settings.auto_restart_limit << "\n";
			}
			if (m_settings.auto_restart_delay != -1) {
				data <<
				"StartLimitIntervalSec=" << m_settings.auto_restart_delay << "\n";
			}
		}

		// Additional build.
		data <<
		"" << "\n" <<
		"[Install]" << "\n" <<
		"WantedBy=multi-user.target" << "\n";
		
		// Handler.
		return data;
		
		//
	}
	#elif OSID == 1
	constexpr
	String 	create_h() {
		
		// Default.
		String data;
		data <<
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>" << "\n" <<
		"<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">" << "\n" <<
		"<plist version=\"1.0\">" << "\n" <<
		"<dict>" << "\n" <<
		"    <key>Label</key>" << "\n" <<
		"    <string>" << m_settings.name << "</string>" << "\n" <<
		"    <key>UserName</key>" << "\n" <<
		"    <string>" << m_settings.user << "</string>" << "\n" <<
		"";
		
		// Arguments.
		data <<
		"	<key>ProgramArguments</key>" << "\n" <<
		"	<array>" << "\n" <<
		"		<string>" << m_settings.command << "</string>" << "\n";
		for (auto& i: m_settings.args) {
			data << "		<string>" << i << "</string>" << "\n";
		}
		data <<
		"	</array>" << "\n";

		// Group.
		if (m_settings.group.is_defined()) {
			data <<
			"    <key>GroupName</key>" << "\n" <<
			"    <string>" << m_settings.group << "</string>" << "\n" <<
			"";
		}

		// Restart.
		if (m_settings.auto_restart) {
			data <<
			"    <key>StartInterval</key>" << "\n" <<
			"    <integer>" << (m_settings.auto_restart_delay == -1 ? 3 : m_settings.auto_restart_delay) << "</integer>" << "\n" <<
			"";
		}

		// Logs.
		if (m_settings.logs.is_defined()) {
			data <<
			"    <key>StandardOutPath</key>" << "\n" <<
			"    <string>" << m_settings.logs << "</string>" << "\n" <<
			"";
		}

		// Errors.
		if (m_settings.errors.is_defined()) {
			data <<
			"    <key>StandardErrorPath</key>" << "\n" <<
			"    <string>" << m_settings.errors << "</string>" << "\n" <<
			"";
		}
			
		// End.
		data <<
		"</dict>" << "\n" <<
		"</plist>" << "\n";
		
		// Handler.
		return data;
		
		//
	}
	#endif
	
	
};
