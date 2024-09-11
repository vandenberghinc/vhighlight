// Author: Daan van den Bergh
// Copyright: � 2022 Daan van den Bergh.

// Backend endpoints.
namespace backend {

// User endpoints.
namespace user {

// Get projects.
Endpoint projects() {
	return Endpoint {
		.method = "GET",
		.endpoint = "/backend/user/projects",
		.content_type = "application/json",
		.rate_limit = {
			.limit = 10,
			.duration = 60,
		},
		.callback = [](Server& server, const Len& uid) {
			Json user_data = server.load_user_data<Json>(uid, "general");	
			docs::check_user_data(user_data);
			// user_data["projects"] = JArray{"vlib", "vdocs", "vweb"};
			// server.save_user_data<Json>(uid, "general", user_data);
			return server.response(
				vlib::http::status::success,
				Json{
					{"message", "Successfully loaded your projects."},
					{"projects", user_data["projects"].asa()},
				}
			);
		}
	};
}

// Delete projects.
Endpoint del_project() {
	return Endpoint {
		.method = "DELETE",
		.endpoint = "/backend/user/projects",
		.content_type = "application/json",
		.auth = Endpoint::authenticated,
		.rate_limit = {
			.limit = 10,
			.duration = 60,
		},
		.callback = [](Server& server, const Len& uid, const Json& params) {

			// Get name.
			vlib::http::Response response;
			String *name;
			if (!vweb::get_param(response, params, name, "name", 4)) {
				return response;
			}

			// Update.
			Json user_data = server.load_user_data<Json>(uid, "general");	
			docs::check_user_data(user_data);
			JsonValue& projects = user_data["projects"];
			if (projects.isa()) {
				projects.asa().remove_r(*name);
				server.save_user_data<Json>(uid, "general", user_data);
			}
			
			// Response.
			return server.response(
				vlib::http::status::success,
				Json{
					{"message", to_str("Successfully removed project \"" *name, "\".")},
				}
			);
		}
	};
}

}	// end namespace user.
}	// end namespace backend.

