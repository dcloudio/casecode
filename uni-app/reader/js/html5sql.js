/* ***** html5sql.js ******
 *
 * Description: A helper javascript module for creating and working with
 *     HTML5 Web Databases.
 *
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 *
 * Authors: Ken Corbett Jr
 *
 * Version 0.9.2
 *
 */

var html5sql = (function() {

	var readTransactionAvailable = false,
		doNothing = function() {},
		emptyArray = [],
		trim = function(string) {
			return string.replace(/^\s+/, "").replace(/\s+$/, "");
		},
		isArray = function(obj) { // From Underscore.js
			return Object.prototype.toString.call(obj) === '[object Array]';
		},
		isUndefined = function(obj) { // From Underscore.js
			return obj === void 0;
		},
		SelectStmtMatch = new RegExp('^select\\s', 'i'),
		isSelectStmt = function(sqlstring) {
			return SelectStmtMatch.test(sqlstring);
		},
		doNothing = function() {},
		// transaction is an sql transaction, sqlObjects are properly formated
		// and cleaned SQL objects
		sqlProcessor = function(transaction, sqlObjects, finalSuccess, failure) {

			var sequenceNumber = 0,
				dataForNextTransaction = null,
				currentSqlObject = null,
				runTransaction = function() {
					transaction.executeSql(sqlObjects[sequenceNumber].sql,
						sqlObjects[sequenceNumber].data,
						successCallback,
						failureCallback);
				},
				successCallback = function(transaction, results) {
					var i, max, rowsArray = [];

					if (html5sql.logInfo) {
						console.log("Success processing: " + sqlObjects[sequenceNumber].sql);
					}

					//Process the results of a select puting them in a much more manageable array form.
					if (html5sql.putSelectResultsInArray && isSelectStmt(sqlObjects[sequenceNumber].sql)) {
						for (i = 0, max = results.rows.length; i < max; i++) {
							rowsArray[i] = results.rows.item(i);
						}
					} else {
						rowsArray = null;
					}

					//Call the success callback provided with sql object
					//If an array of data is returned use that data as the
					//data attribute of the next transaction
					dataForNextTransaction = sqlObjects[sequenceNumber].success(transaction, results, rowsArray);
					sequenceNumber++;
					if (dataForNextTransaction && $.isArray(dataForNextTransaction)) {
						sqlObjects[sequenceNumber].data = dataForNextTransaction;
						dataForNextTransaction = null;
					} else {
						dataForNextTransaction = null;
					}

					if (sqlObjects.length > sequenceNumber) {
						runTransaction();
					} else {
						finalSuccess(transaction, results, rowsArray);
					}
				},
				failureCallback = function(transaction, error) {
					if (html5sql.logErrors) {
						console.error("Error: " + error.message + " while processing statment " + (sequenceNumber + 1) + ": " + sqlObjects[sequenceNumber].sql);
					}
					failure(error, sqlObjects[sequenceNumber].sql);
				};

			runTransaction();
		},
		sqlObjectCreator = function(sqlInput) {
			var i;
			if (typeof sqlInput === "string") {
				trim(sqlInput);

				//Separate sql statements by their ending semicolon
				sqlInput = sqlInput.split(';');

				for (i = 1; i < sqlInput.length; i++) {
					//Ensure semicolons within quotes are replaced
					while (sqlInput[i].split(/["]/gm).length % 2 === 0 ||
						sqlInput[i].split(/[']/gm).length % 2 === 0 ||
						sqlInput[i].split(/[`]/gm).length % 2 === 0) {
						sqlInput.splice(i, 2, sqlInput[i] + ";" + sqlInput[i + 1]);
					}
					//Add back the semicolon at the end of the line
					sqlInput[i] = trim(sqlInput[i]) + ';';
					//Get rid of any empty statements
					if (sqlInput[i] === ';') {
						sqlInput.splice(i, 1);
					}
				}
			}
			for (i = 0; i < sqlInput.length; i++) {
				//If the array item is only a string format it into an sql object
				if (typeof sqlInput[i] === "string") {
					sqlInput[i] = {
						"sql": sqlInput[i],
						"data": [],
						"success": doNothing
					};
				} else {
					if (isUndefined(sqlInput[i].data)) {
						sqlInput[i].data = [];
					}
					if (isUndefined(sqlInput[i].success)) {
						sqlInput[i].success = doNothing;
					}
					// Check to see that the sql object is formated correctly.
					if (typeof sqlInput[i] !== "object" ||
						typeof sqlInput[i].sql !== "string" ||
						typeof sqlInput[i].success !== "function" ||
						!isArray(sqlInput[i].data)) {
						throw new Error("Malformed sql object: " + JSON.stringify(sqlInput[i]));
					}
				}
			}
			return sqlInput;
		},
		statementsAreSelectOnly = function(SQLObjects) {
			// Returns true if all SQL statement objects are SELECT statements.
			var i = 0;

			//Loop over SQL objects ensuring they are select statments
			do {
				//If the sql string is not a select statement return false
				if (!isSelectStmt(SQLObjects[i].sql)) {
					return false;
				}
				i++;
			} while (i < SQLObjects.length);

			//If all the statments happen to be select statments return true
			return true;
		};
	return {
		database: null,
		logInfo: false,
		logErrors: false,
		defaultFailureCallback: doNothing,
		putSelectResultsInArray: true,
		openDatabase: function(name, displayname, size, whenOpen) {
			html5sql.database = openDatabase(name, "", displayname, size);
			readTransactionAvailable = typeof html5sql.database.readTransaction === 'function';
			if (whenOpen) {
				whenOpen();
			}
		},

		process: function(sqlInput, finalSuccessCallback, failureCallback) {
			/*
			 *
			 *	Arguments:
			 *
			 *  sql = [array SQLObjects] ~ collection of SQL statement objects
			 *           or
			 *        [array SQLStrings] ~ collection of SQL statement strings
			 *           or
			 *        "SQLstring"        ~ SQL string to be split at the ';'
			 *                             character and processed sequentially
			 *
			 *  finalSuccessCallback = (function) ~ called after all sql statments have
			 *                               		been processed.  Optional.
			 *
			 *  failureCallback = (function) ~ called if any of the sql statements
			 *                                 fails.  A default one is used if none
			 *                                 is provided.
			 *
			 *
			 *	SQL statement object:
			 *	{
			 *	 sql: "string",      !Required! ~ Your sql as a string
			 *	 data: [array],       Optional  ~ The array of data to be sequentially
			 *	                                  inserted into your sql at the ?
			 *   success: (function), Optional  ~ A function to be called if this
			 *                                    individual sql statment succeeds.
			 *                                    If an array is returned it is used as
			 *                                    the data for the next sql statement
			 *                                    processed.
			 *  }
			 *
			 *	Usage:
			 *	html5sql.process(
			 *		[{
			 *		   sql: "SELECT * FROM table;",
			 *		   data: [],
			 *		   success: function(){}
			 *		 },
			 *		 {
			 *		   sql: "SELECT * FROM table;",
			 *		   data: [],
			 *		   success: function(){}
			 *		 }],
			 *		function(){},
			 *		function(){}
			 *	);
			 *
			 */
			if (html5sql.database) {

				var sqlObjects = sqlObjectCreator(sqlInput);

				if (isUndefined(finalSuccessCallback)) {
					finalSuccessCallback = doNothing;
				}

				if (isUndefined(failureCallback)) {
					failureCallback = html5sql.defaultFailureCallback;
				}

				if (statementsAreSelectOnly(sqlObjects) && readTransactionAvailable) {
					html5sql.database.readTransaction(function(transaction) {
						sqlProcessor(transaction, sqlObjects, finalSuccessCallback, failureCallback);
					});
				} else {
					html5sql.database.transaction(function(transaction) {
						sqlProcessor(transaction, sqlObjects, finalSuccessCallback, failureCallback);
					});
				}
			} else {
				// Database hasn't been opened.
				if (html5sql.logErrors) {
					console.error("Error: Database needs to be opened before sql can be processed.");
				}
				return false;
			}
		},

		changeVersion: function(oldVersion, newVersion, sqlInput, finalSuccessCallback, failureCallback) {
			/* This is the same as html5sql.process but used when you want to change the
			 * version of your database.  If the database version matches the oldVersion
			 * passed to the function the statements passed to the funciton are
			 * processed and the version of the database is changed to the new version.
			 *
			 *	Arguments:
			 *	oldVersion = "String"             ~ the old version to upgrade
			 *	newVersion = "String"             ~ the new version after the upgrade
			 *  sql = [array SQLObjects] ~ collection of SQL statement objects
			 *           or
			 *        [array SQLStrings] ~ collection of SQL statement strings
			 *           or
			 *        "SQLstring"        ~ SQL string to be split at the ';'
			 *                             character and processed sequentially
			 *
			 *  finalSuccessCallback = (function) ~ called after all sql statments have
			 *                               		been processed.  Optional.
			 *
			 *  failureCallback = (function) ~ called if any of the sql statements
			 *                                 fails.  A default one is used if none
			 *                                 is provided.
			 *
			 *	SQL statement object:
			 *	{
			 *	 sql: "string",      !Required! ~ Your sql as a string
			 *	 data: [array],       Optional  ~ The array of data to be sequentially
			 *	                                  inserted into your sql at the ?
			 *   success: (function), Optional  ~ A function to be called if this
			 *                                    individual sql statment succeeds
			 *   failure: (function), Optional  ~ A function to be called if this
			 *                                    individual sql statement fails
			 *  }
			 *
			 *	Usage:
			 *	html5sql.changeVersion(
			 *	    "1.0",
			 *	    "2.0",
			 *		[{
			 *		   sql: "SELECT * FROM table;",
			 *		   data: [],
			 *		   success: function(){},
			 *		   failure: function(){}
			 *		 },
			 *		 {
			 *		   sql: "SELECT * FROM table;",
			 *		   data: [],
			 *		   success: function(){},
			 *		   failure: function(){}
			 *		 }],
			 *		function(){},
			 *		function(){}
			 *	);
			 *
			 */
			if (html5sql.database) {
				if (html5sql.database.version === oldVersion) {
					var sqlObjects = sqlObjectCreator(sqlInput);

					if (isUndefined(finalSuccessCallback)) {
						finalSuccessCallback = doNothing;
					}

					if (isUndefined(failureCallback)) {
						failureCallback = html5sql.defaultFailureCallback;
					}

					html5sql.database.changeVersion(oldVersion, newVersion, function(transaction) {
						sqlProcessor(transaction, sqlObjects, finalSuccessCallback, failureCallback);
					});
				}
			} else {
				// Database hasn't been opened.
				if (html5sql.logErrors) {
					console.log("Error: Database needs to be opened before sql can be processed.");
				}
				return false;
			}

		}
	};

})();