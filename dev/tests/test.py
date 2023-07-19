a(Hello)
"a(Hello)"
#a(Hello)
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# imports.
dev0s.classes.defaults.exceptions import Exceptions
from dev0s.classes.defaults.exceptions import Exceptions
from dev0s.classes.defaults.files import *
from dev0s.classes.defaults.files import

# pip imports.
from django.http import JsonResponse
import json as pypi_json
import traceback as _traceback_

# the response manager class.
class Response(object):
	def __init__(self):
	
		test_num = 1;
		testnum1 = 100;
		test_num = 0.3209834;
		testnum=3;
		testmstr = """Hello World!"""
		testmstr = """
		Hello World!
		"""
		
		testmstr = '''
		Hello World!
		'''
		
		# docs.
		DOCS = {
			"module":"dev0s.response",
			"initialized":True,
			"description":[],
			"chapter":"Response", }

		# set log file.
		#	assign new values with self.log_file.assign(...) to keep it shared across other objects.
		self.log_file = String(str(None))
		self.log_file = String(str(None, b="Hi"))

		# set log level.
		#	assign new values with self.log_level.assign(...) to keep it shared across other objects.
		self.log_level = Integer(0)
		
		# objects.
		self.parameters = Parameters()

		# for imports.
		self.ResponseObject = ResponseObject

		# log the timestamps by default.
		self.log_timestamps = True
		
	def test(self,
		hi,
		there="Hi"
	):
		return None

	# response functions.
	def success(self,
		# the message (must be param #1).
		message,
		# additional returnable functions (must be param #2).
		variables={},
		# log log level of the message (int).
		log_level=None,
		# the required log level for when printed to console (leave None to use self.log_level).
		required_log_level=None,
		# save the error to the logs file.
		save=False,
		# return as a django Jsonresponse.
		django=False,
	):
		response = self.response({
			"success":True,
			"message":message,
			"error":None,
		})
		for key, value in variables.items():
			response[key] = value
		self .log(message=response["message"], log_level=log_level, save=save, required_log_level=required_log_level)
		self.log(message=response["message"], log_level=log_level, save=save, required_log_level=required_log_level)
		if django:
			try:
				response = JsonResponse(response.dict(safe=True), safe=False)
			except AttributeError:
				response = JsonResponse(response, safe=False)
		return response
	def error(self,
		# the error message.
		error="",
		# log log level of the message (int).
		log_level=None,
		# the required log level for when printed to console (leave None to use self.log_level).
		required_log_level=None,
		# save the error to the erros file.
		save=False,
		# return as a django Jsonresponse.
		django=False,
		# raise error for developer traceback.
		traceback=ERROR_TRACEBACK,
	):
		response = self.response({
			"success":False,
			"message":None,
			"error":error,
		})
		self.log(error=response["error"], log_level=log_level, save=save, required_log_level=required_log_level)
		if traceback:
			raise ValueError(response["error"])
		if django:
			try:
				response = JsonResponse(response.dict(safe=True), safe=False)
			except AttributeError:
				response = JsonResponse(response, safe=False)
		return response
		#

	# log functions.
	def log(self,
		# option 1:
		# the message (#1 param).
		message=None,
		# option 2:
		# the error.
		error=None,
		# option 3:
		# the response dict (leave message None to use).
		response={},
		# print the response as json.
		json=False,
		# optionals:
		# the active log level.
		log_level=0,
		# the required log level for when printed to console (leave None to use self.log_level).
		required_log_level=None,
		# save to log file.
		save=False,
		# save errors always (for options 2 & 3 only).
		save_errors=None,
		# the log mode (leave None for default).
		mode=None,
	):
		if mode != None: mode = str(mode).lower().replace("-","").replace("_","")
		if mode not in [None, "warning", "alert"]:
			raise Exceptions.InvalidUsage(f"{self.__traceback__(function='log', parameter='mode')}: Selected an invalid mode [{mode}], options: [None, warning, alert].")
		def fill_message(msg, error=False):
			if mode == None:
				if error:
					msg = f"Error: {msg}"
				else:
					msg = msg
			elif mode == "warning":
				msg = f"&RED&Warning&END&: {msg}"
			elif mode == "alert":
				msg = f"&ORANGE&Alert&END&: {msg}"
			return msg
			#
		msg, _error_ = None, False
		if [message,error,response] == [None,None,{}]:
			raise Exceptions.InvalidUsage(f"{self.__traceback__(function='log')}: Define either parameter [message:str], [error:str] or [response:dict].")
		if response != {}:
			if response["error"] != None:
				_error_ = True
				msg = f"Error: {response['error']}"
			else:
				if response.__class__.__name__ in ["Output"]:
					msg = response.output
				else:
					msg = response["message"]
		elif isinstance(error, (str, String)):
			msg = fill_message(error, error=True)
		else:
			msg = fill_message(message, error=False)
		if required_log_level == None: required_log_level = self.log_level
		try:
			required_log_level = int(required_log_level)
		except:
			required_log_level = 0
		try:
			comparison = log_level != None and log_level >= required_log_level
		except TypeError as e:
			if "not supported between instances of 'dict' and 'int'" in f"{e}":
				raise TypeError(f"You most likely returned a response.error when you meant a response.success, error: {e}")
			else:
				raise TypeError(e)
		if comparison:
			#print(f"{Date().seconds_timestamp} - {color.fill(msg)}")
			if json:
				if response != {}:
					print(response.json())
				elif error != None:
					print(self.error(error))
				else:
					print(self.success(message))
			else:
				if self.log_timestamps:
					print(f"{Date().seconds_timestamp} - {color.fill(msg)}")
				else:
					print(f"{color.fill(msg)}")
		if save:
			self.log_to_file(msg)
		elif save_errors and _error_:
			self.log_to_file(msg)

		#
	def load_logs(self, format="webserver", options=["webserver", "cli", "array", "string"]):
		if self.log_file == None:
			return self.error("Define the dev0s.response.log_file attribute.")
		if not Files.exists(self.log_file): Files.create(self.log_file)
		try:
			logs = Files.load(self.log_file)
		except Exception as e:
			return self.error(f"Failed to load the logs, error: {e}.")
		if format == "webserver":
			while True:
				if "<!DOCTYPE html>" in logs:
					old = str(logs)
					logs = String(logs).replace_between(["<!DOCTYPE html>", "</html>"], " *** HTML CODE ****")
					if logs == old:
						return self.error("Unable remove the html code from the logs.")
				else: break
			logs = logs.replace("\n", "<br>")
		elif format == "cli":
			a=1
		elif format == "array" or format == list:
			logs = logs.split("\n")
		elif format == "string" or format == str:
			logs = str(logs)
		else:
			return self.error(f"Invalid format parameter [{format}], valid options: {options}.")

		return self.success("Succesfully loaded the logs.", {"logs":logs})
	def reset_logs(self, format="webserver", options=["webserver", "cli", "array", "string"]):
		Files.save(self.log_file, f"Resetted log file.\n")
		response = self.load_logs(format=format)
		if not response.success:  return self.error(f"Failed to load the logs after restting, error: {response.error}")
		return self.success("Succesfully resetted the logs.", {
			"logs":response.logs,
		})
		
		#
	
	# serialize a variable.
	def serialize(self,
		# the variable to serialize.
		variable={},
		# serialize to json format.
		json=False,
		# serialize all unknown objects to str.
		safe=False,
	):
		if variable.__class__.__name__ in ["str", "String", "NoneType", "bool", "Boolean"]:
			if str(variable) in ["true", "True", "TRUE", True]:
				if json:
					return "true"
				else:
					return True
			elif str(variable) in ["false", "False", "FALSE", False]:
				if json:
					return "false"
				else:
					return False
			elif str(variable) in ["null", "None", "Nan", None]:
				if json:
					return "null"
				else:
					return None
			else:
				integer = None
				try:
					if "." in str(variable):
						integer = float(variable)
					else:
						integer = int(variable)
				except:
					integer = None
				if integer != None:
					return integer
				else:
					try:
						variable = pypi_json.loads(variable)
					except:
						try:
							variable = ast.literal_eval(variable)
						except:
							try:
								variable = pypi_json.loads(String(variable).slice_dict())
							except:
								return str(variable)
		elif isinstance(variable, ResponseObject):
			variable = variable.dict()
		elif variable.__class__.__name__ in ["OutputObject"]:
			variable = variable.response().dict()
		elif isinstance(variable, (dict,Dictionary, list, Array)):
			variable = variable
		elif (json or safe) and not isinstance(variable, (Dictionary)) and isinstance(variable, object):
			if isinstance(variable, (Date)):
				return f'"{variable.raw()}"'
			elif variable.__class__.__name__ in ["Version", "OutputObject"] or isinstance(variable, (Integer,Boolean,Bytes,Array,File,ResponseObject)):
				return variable.raw()
			elif variable in [None, "None"]:
				return None
			else:
				return str(variable)
		else:
			if json or safe:
				return str(variable)
			else:
				return variable
		if isinstance(variable, (dict, Dictionary)):
			_variable_ = {}
			for key, value in variable.items():
				_variable_[key] = self.serialize(variable=value, json=json)
			return _variable_
		elif isinstance(variable, (list, Array)):
			_variable_ = []
			for value in variable:
				_variable_.append(self.serialize(variable=value, json=json))
			return _variable_
		else:
			if json or safe:
				return str(variable)
			else:
				return variable
		
		#
	def response(self,
		# the blank response (dict, str, generator) (#1).
		response={
			"success":False,
			"message":None,
			"error":None,
		},
	):
		# serialize shortcut.
		return self.ResponseObject(response)
		#

	# system functions.
	def log_to_file(self, message, raw=False):

		# init.
		try:
			while True:
				if len(message) > 0 and message[len(message)-1] == "\n": message = message[:-1]
				else: break
			with open(self.log_file, "a") as file:
				if raw:
					file.write(f'{message}\n')
				else:
					file.write(f'{Date().seconds_timestamp} - {message}\n')
			response = self.response()
			response["success"] = True
			response["message"] = "Succesfully logged the message."
		
			# check file size.
			size = FilePath(self.log_file).size(mode="mb", format="integer")
			if size >= 100: self.reset_logs()

			# handler.
			return response

		except Exception as e:
			response = self.response()
			response["error"] = f"Failed to log the message, error: {e}."
			return response
			
		#

	# quote & unqoute dict.
	def quote(self, dictionary):
		return urllib.parse.quote(json.dumps(dictionary))
		#
	def unquote(self, encoded):
		return json.loads(urllib.parse.unquote(encoded))
		#

	#
	
# the parameters manager object class.
class Parameters(object):
	def __init__(self):
		
		# docs.
		DOCS = {
			"module":"dev0s.response.parameters",
			"initialized":True,
			"description":[],
			"chapter":"Response", }

		#
	
	# get request parameters.
	def get(self,
		# the django request (1).
		request=None,
		# the identifiers (#2).
		#	str instance: return the parameters value.
		#	list instance: return a parameters object & return an error response when a parameter is undefined.
		#	dict instance: return a parameters object & return the parameter's value from the dict as a default when undefined.
		parameters=[],
		# traceback id.
		traceback=None,
	):
		if request == None:
			raise Exceptions.InvalidUsage("<dev0s.response.paramters.get>: Define parameter: [request].")
		
		# single parameter.
		if isinstance(parameters, (str,String)):

			# get params & format.
			parameters = str(parameters)
			format = None
			if ":" in parameters:
				parameters,format = parameters.split(":")
				while True:
					if " " in format: format = format.replace(" ","")
					else: break

			# get variable.
			if request.method in ["post", "POST"]:
				variable = request.POST.get(parameters)
			else:
				variable = request.GET.get(parameters)
			if variable in ["", None]:
				if traceback != None:
					return variable, _response_.error(f"{traceback}: Define parameter: [{parameters}].")
				else:
					return variable, _response_.error(f"Define parameter: [{parameters}].")

			# handle format.
			if format != None:
				format_options = format.split(",")
				found = False
				for format in format_options:
					if format.lower() in ["str", "string"]:
						try:
							variable = str(variable)
							found = True
						except: a=1
					elif format.lower() in ["int", "integer"]:
						try:
							variable = int(variable)
							found = True
						except: a=1
					elif format.lower() in ["bool", "boolean"]:
						try:
							if variable in ["true", "True", "TRUE", True]: variable = True
							else: variable = False
							found = True
						except: a=1
					elif format.lower() in ["float", "double"]:
						try:
							variable = float(variable)
							found = True
						except: a=1
					elif format.lower() in ["array", "list", "dict", "dictionary"]:
						try:
							variable = ast.literal_eval(variable)
							found = True
						except:
							try:
								variable = json.loads(variable)
								found = True
							except:
								a=1
					else:
						raise Exceptions.InvalidUsage(f"Selected format [{format}] is not a valid format option.")
					if found:
						break
				if not found:
					return variable, _response_.error(f"Unable to parse excepted format [{Array(format_options).string(joiner=', ')}] from parameter [{parameters}:{variable}].")

			# normalize.
			if variable == "None": variable = None

			# handler.
			return variable, _response_.success(f"Succesfully retrieved request parameter [{parameters}].", {
				"key":parameters,
				"value":variable,
			})

		# list recursive.
		elif isinstance(parameters, (list, Array)):
			optional = False
			params = ResponseObject()
			for param in parameters:
				param_value, response = self.get(request, param, traceback=traceback)
				param = param.split(":")[0]
				if response["error"] != None:
					if optional:
						params[param] = None
					else:
						return params, response
				else:
					params[param] = param_value
			if optional:
				for key in parameters:
					try: params[key]
					except: params[key] = None
			return params, _response_.success(f"Succesfully retrieved {len(params)} request parameter(s).")

		# dict recursive.
		elif isinstance(parameters, (dict, Dictionary, ResponseObject)):
			if isinstance(parameters, (ResponseObject)): parameters = parameters.clean()
			optional = True
			params = ResponseObject()
			for param,default in parameters.items():
				param_value, response = self.get(request, param, traceback=traceback)
				param = param.split(":")[0]
				if response["error"] != None:
					if optional:
						params[param] = default
					else:
						return params, response
				else:
					params[param] = param_value
			if optional:
				for key,default in parameters.items():
					try: params[key]
					except: params[key] = default
			return params, _response_.success(f"Succesfully retrieved {len(params)} request parameter(s).")


		# invalid.
		else:
			raise Exceptions.InvalidUsage(f"The parameters parameter must be [str, String, list, Array, dict, Dictionary] not [{dictionary.__class__.__name__}].")
		
		#

	# check parameter's values.
	def check(self,
		# the parameters (dict) (#1).
		parameters={"parameter":None},
		# the recognizer value for when the parameters are supposed to be empty.
		default=None,
		# the traceback id.
		traceback=None,
	):

		# single.
		if isinstance(parameters, tuple):
			name,parameter = parameters
			if parameter == default:
				if traceback != None:
					return _response_.error(f"{traceback}: Define parameter [{name}].")
				else:
					return _response_.error(f"Define parameter [{name}].")
			if ":" in name:
				name,formats = name.split(":")
				while True:
					if " " in formats: formats = formats.replace(" ","")
					else: break
				formats = formats.split(",")
				param_format = Formats.get(parameter, serialize=True)
				if param_format not in formats:
					return _response_.error(f"Incorrect parameter [{name}:{param_format}] format, correct format(s): {Array(path=False, array=formats).string(joiner=', ')}.")
			return _response_.success(f"Succesfully checked parameter [{name}].")

		# recursive.
		elif isinstance(parameters, (dict,Dictionary,ResponseObject)):
			for id, value in parameters.items():
				response = self.check(parameters=(id, value), default=default, traceback=traceback)
				if response["error"] != None: return response
			return _response_.success(f"Succesfully checked {len(parameters)} parameter(s).")
		# invalid.
		else:
			raise Exceptions.InstanceError(f"Parameter [parameters] requires to be a [dict, Dictionary, tuple] not [{parameters.__class__.__name__}].")

		#

	#

# the response & parameters object class.
class ResponseObject(object):
	def __init__(self,
		#
		# Should be initialized with response.success or response.error.
		#
		# the response attributes (dict or dict in str format).
		attributes={
			"success":False,
			"message":None,
			"error":None,
		},
	):
		# docs.
		DOCS = {
			"module":"ResponseObject",
			"initialized":False,
			"description":[],
			"chapter": "Response", }

		# serialize attributes to dict.
		serialized = _response_.serialize(attributes)
		if not isinstance(serialized, (dict, Dictionary)):
			raise Exceptions.InvalidUsage(f"<ResponseObject.attributes>: parameter [attributes] must be a [dict, dict in str format], not [{attributes.__class__.__name__}].")
		self.assign(serialized)
		
		# catch error so you can also init custom ResponseObjects.
		try:

			# clean message & error.
			if self.message != None: self.message = String(self.message).capitalized_word()
			if self.error != None: self.error = String(self.error).capitalized_word()
			while True:
				if self.message != None and len(self.message) >= 1 and self.message[len(self.message)-1] in [" ", ".", ","]:
					self.message = self.message[:-1]
				elif self.error != None and len(self.error) >= 1 and self.error[len(self.error)-1] in [" ", ".", ","]:
					self.error = self.error[:-1]
				elif self.error != None and len(self.error) >= len("Error: ") and self.error[:len("Error: ")] in ["Error: "]:
					self.error = String(self.error[len("Error: "):]).capitalized_word()
				elif self.error != None and len(self.error) >= len("..") and String(self.error).last("..") in [".."]:
					self.error = str(String(self.error).remove_last("."))
				else: break
			
			# add dot.
			if self.message != None  and len(self.message) > 0 and self.message[len(self.message)-1] not in ["!", "?"]:
				self.message += "."
			if self.error != None  and len(self.error) > 0 and self.error[len(self.error)-1] not in ["!", "?"]:
				self.error += "."


			# check error passed as success response. & reversed
			if self.message != None and len(self.message) >= len("Failed") and self.message[:len("Failed")] == "Failed":
				#_traceback_.print_exc()
				raise ValueError("A success response may not start with (failed ...). You most likely called an response.success return while you meant response.error.")
			if self.error != None and len(self.error) >= len("Success") and self.error[:len("Success")] == "Success":
				#_traceback_.print_exc()
				raise ValueError("An error response may not start with (success ...). You most likely called an response.error return while you meant response.success.")
		except AttributeError: a=1
		#
	# clean default values.
	def clean(self,
		# the clean options, select * for all, options: [traceback].
		options=["*"],
		# serialize to ResponseObject (with serialize False the ResponseObject's values are not updated).
		serialize=True,
	):
		
		# options.
		if options in ["*", "all"]: options = ["*"]
		_options = []
		for i in options: _options.append(i.lower())
		options = _options
		
		# clean.
		attributes = self.dict(json=False)
		remove = ["error", "message", "success"]
		if "*" in options or "traceback" in options: remove += ["_traceback_", "__traceback__", "raw_traceback", "_raw_traceback_", "__raw_traceback__"]
		for i in remove:
			try:
				if serialize:
					del self[str(i)]
				else:
					del attributes[str(i)]
			except: a=1
		if serialize:
			return self
		else:
			return attributes

		#
	# assign dict.
	def assign(self, dictionary):
		if isinstance(dictionary, (dict, Dictionary)):
			for key,value in _response_.serialize(dictionary).items():
				self[key] = value
		elif isinstance(dictionary, (tuple, list, Array)):
			for key,value in dictionary:
				self[key] = _response_.serialize(value)
		else:
			raise Exceptions.InvalidUsage("The dictionary parameter must be a dict or tuple.")
		return self
	# crash the error message.
	def crash(self, error="ValueError", traceback=True, json=False, error_only=False):
		if error_only and self["error"] == None: return None
		if json:
			self.log(error=self["error"], json=json)
			sys.exit(1)
		else:
			#if not traceback:
			#	sys.tracebacklimit = 0
			#else:
			#	sys.tracebacklimit = 1
			if error.lower() in ["valueerror", "value_error"]: raise ValueError(self["error"])
			else: raise Exception(self["error"])
	def unpack(self,
		# the key / keys / defaults parameter (#1).
		# str instance:
		#   unpack the str key
		# list instance:
		#   unpack all keys in the list.
		# dict instance:
		#   unpack all keys from the dict & when not present return the key's value as default.
		keys,
	):
		defaults_ = {}
		if isinstance(keys, (dict, Files.Dictionary, ResponseObject)):
			if isinstance(keys, dict):
				defaults_ = dict(keys)
				keys = list(keys.keys())
			else:
				defaults_ = keys.dict()
				keys = keys.keys()
		elif isinstance(keys, str):
			keys = [keys]
		unpacked = []
		for key in keys:
			value, set = None, True
			try:
				value = self[key]
			except KeyError:
				try:
					value = defaults_[key]
				except KeyError:
					set = False
			if not set:
				raise Exceptions.UnpackError(f"Dictionary does not contain attribute [{key}].")
			unpacked.append(value)
		return unpacked
	def remove(self, keys=[], values=[], save=False):
		for i in keys:
			try: del self[i]
			except: a=1
		if values != []:
			new = {}
			for k,v in self.iterate():
				if v not in values: new[k] = v
			self.assign(new)
		if save: self.save()
		return self
	# iterations.
	def iterate(self, sorted=False, reversed=False):
		return self.items(reversed=reversed, sorted=sorted)
	def items(self, sorted=False, reversed=False, dictionary=None):
		if dictionary == None:
			dictionary = self.dict()
		if sorted: dictionary = self.sort()
		if reversed: return self.reversed().items()
		else: return dictionary.items()
	def keys(self, sorted=False, reversed=False):
		if sorted:
			return self.sort(self.keys(sorted=False, reversed=reversed))
		if reversed:
			keys = list(vars(self))
			reversed_keys = []
			c = len(keys)-1
			for _ in range(len(keys)):
				reversed_keys.append(keys[c])
				c -= 1
			return reversed_keys
		else: return list(vars(self))
	def values(self, sorted=False, reversed=False, dictionary=None):
		if dictionary == None: dictionary = self.dict()
		if sorted:
			return self.sort(self.values(sorted=False, reversed=reversed, dictionary=dictionary))
		values = []
		for key, value in self.items(reversed=reversed, dictionary=dictionary):
			values.append(value)
		return values
	def reversed(self, dictionary=None):
		if dictionary == None: dictionary = self.dict()
		reversed_dict = []
		for key in self.keys(reversed=True, dictionary=dictionary):
			reversed_dict[key] = dictionary[key]
		return reversed_dict
	def sort(self, reversed=False, dictionary=None):
		if dictionary == None: dictionary = self.dict()
		return Dictionary(dictionary).sort(reversed=reversed).raw()
		#for key in _sorted_:
		#	new[Formats.denitialize(key)] = dictionary[Formats.denitialize(key)]
		return new
	# return self as dict.
	def dict(self, sorted=False, reversed=False, json=False, safe=False):
		dictionary = {}
		for key in self.keys():
			dictionary[Formats.denitialize(key)] = self[Formats.denitialize(key)]
		return self.serialize(json=json, sorted=sorted, reversed=reversed, safe=safe, dictionary=dictionary)
	# dump json string.
	def json(self, sorted=False, reversed=False, indent=4, safe=True, dictionary=None, ):
		if dictionary == None: dictionary = self.dict()
		return json.dumps(self.serialize(json=True, sorted=sorted, reversed=reversed, safe=safe, dictionary=dictionary), indent=indent).replace(': "false"', ': false').replace(': "true"', ': true').replace(': "null"', ': null')
	# serialize dict.
	def serialize(self, sorted=False, reversed=False, json=False, safe=False, dictionary=None):
		if dictionary == None: dictionary = self.dict()
		if isinstance(dictionary, Dictionary):
			dictionary = dictionary.dictionary
		if sorted:
			d = {}
			for key, value in self.items(reversed=reversed, dictionary=self.sort(dictionary=dictionary)):
				d[key] = value
			dictionary = d
		else:
			d = {}
			for key, value in self.items(reversed=reversed, dictionary=dictionary):
				d[key] = value
			dictionary = d
		return _response_.serialize(variable=dictionary, json=json, safe=safe)
	# support default iteration.
	def __iter__(self):
		return iter(self.keys())
	# support '>=' & '>' operator.
	def __gt__(self, response):
		if not isinstance(directory, self.__class__):
			raise Exceptions.InstanceError(f"Can not compare object {self.__class__} & {response.__class__}.")
		return len(self) > len(response)
	def __ge__(self, response):
		if not isinstance(response, self.__class__):
			raise Exceptions.InstanceError(f"Can not compare object {self.__class__} & {response.__class__}.")
		return len(self) >= len(response)
	# support '<=' & '<' operator.
	def __lt__(self, response):
		if not isinstance(response, self.__class__):
			raise Exceptions.InstanceError(f"Can not compare object {self.__class__} & {response.__class__}.")
		return len(self) < len(response)
	def __le__(self, response):
		if not isinstance(response, self.__class__):
			raise Exceptions.InstanceError(f"Can not compare object {self.__class__} & {response.__class__}.")
		return len(self) <= len(response)
	# support '==' & '!=' operator.
	def __eq__(self, dictionary):
		if isinstance(dictionary, dict):
			return str(self.sort()) == str(Dictionary(dictionary).sort())
		elif isinstance(dictionary, Dictionary):
			return str(self.sort()) == str(dictionary.sort())
		else:
			try:
				return str(self.sort()) == str(dictionary.sort())
			except:
				return False
	def __ne__(self, dictionary):
		if isinstance(dictionary, dict):
			return str(self.sort()) != str(Dictionary(dictionary).sort())
		elif isinstance(dictionary, Dictionary):
			return str(self.sort()) != str(dictionary.sort())
		else:
			try:
				return str(self.sort()) != str(dictionary.sort())
			except:
				return False
	# support 'in' operator.
	def __contains__(self, response):
		keys = self.keys()
		if isinstance(response, (list, Array)):
			for i in response:
				if response in keys:
					return True
			return False
		else:
			return response in keys
	# support item assignment.
	def __setitem__(self, key, value):
		setattr(self, key, value)
	def __getitem__(self, key):
		return getattr(self, key)
	def __delitem__(self, key):
		delattr(self, key)
	# str representable.
	def __str__(self):
		return self.json(indent=4)
	# bool representable.
	def __bool__(self):
		return self.success
		#
	# content count.
	def __len__(self):
		return len(self.keys())
	# object id.
	def __id__(self):
		return f"({self.instance()}:{str(self)})"
	# object instance.
	def instance(self):
		return "ResponseObject"
	@property
	def __name__(self):
		return self.instance()
	# return raw data.
	def raw(self):
		return self.dict()
	# return response self for OutputObject and other objects that init ResponseObject as self and want it to be converted to response.
	def response(self):
		return self
		#

# initialized objects.
# must be initialized as Response since object class Parameters requires it.
response = Response()
_response_ = response
