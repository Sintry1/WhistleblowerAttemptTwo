using DotNetEnv;
using MySql.Data.MySqlClient;

namespace WhistleblowerSolution.Server.Database
{
    public class PreparedStatements
    {
        /* Makes a private dbConnection of type DBConnection, that can only be written to in initialization or in the constructor
         * this ensures that the connection can only be READ by other classes and not modified
         */
        private readonly DBConnection dbConnection;

        //Constructor for PreparedStatements
        private PreparedStatements()
        {
            Env.Load();
            dbConnection = DBConnection.CreateInstance();
        }

        //Method for creating an instance of PreparedStatements
        //This is needed as the constructor above is private for security.
        public static PreparedStatements CreateInstance()
        {
            return new PreparedStatements();
        }

        //for getting industry ID from industry name
        internal int GetIndustryID(string industryName)
        {
            try
            {
                // Set credentials for the user needed
                dbConnection.SetConnectionCredentials(
                    Env.GetString("OTHER_READER_NAME"),
                    Env.GetString("OTHER_READER_PASSWORD")
                );

                // Use MySqlConnection to open the connection and throw an exception if it fails
                using (MySqlConnection connection = dbConnection.OpenConnection())
                {
                    Console.WriteLine("Connection opened successfully.");

                    try
                    {
                        // Query to get industry_id based on industryName
                        string industryIdQuery =
                            "SELECT industry_id FROM industry WHERE industry_name = @industry_name";

                        // Create and prepare an SQL statement for industry_id
                        MySqlCommand industryIdCommand = new MySqlCommand(
                            industryIdQuery,
                            connection
                        );

                        industryIdCommand.Parameters.AddWithValue("@industry_name", industryName);

                        industryIdCommand.Prepare();

                        // Execute the query to get industry_id
                        int industryId = Convert.ToInt32(industryIdCommand.ExecuteScalar());

                        return industryId;
                    }
                    catch (InvalidOperationException ex)
                    {
                        Console.WriteLine($"Error preparing command: {ex.Message}");
                        throw;
                    }
                    catch (MySqlException ex)
                    {
                        // Handle the exception (e.g., log it) and rethrow
                        Console.WriteLine($"Error executing query: {ex.Message}");
                        throw; // Rethrow the caught exception
                    }
                    finally
                    {
                        // Close the connection at the end
                        dbConnection.CloseConnection();
                        Console.WriteLine("Connection closed.");
                    }
                }
            }
            catch (Exception ex)
            {
                // Handle the exception if opening the connection fails
                Console.WriteLine($"Error opening connection: {ex.Message}");
                throw; // Rethrow the caught exception
            }
        }

        //fetching publickey
        internal string GetPublicKey(string industryName)
        {
            try
            {
                //Calls another prepared statement to get the industry ID from the industry name
                int industryId = GetIndustryID(industryName);

                Console.WriteLine($"industry name is: {industryName}");
                // Set credentials for the user needed
                dbConnection.SetConnectionCredentials(
                    Env.GetString("OTHER_READER_NAME"),
                    Env.GetString("OTHER_READER_PASSWORD")
                );

                // Use MySqlConnection to open the connection and throw an exception if it fails
                using (MySqlConnection connection = dbConnection.OpenConnection())
                {

                    try
                    {
                        // Create an instance of MySqlCommand
                        MySqlCommand command = new MySqlCommand(null, connection);

                        // Create and prepare an SQL statement.
                        command.CommandText =
                            $"SELECT public_key FROM regulators WHERE industry_id = @industry_id";

                        // Sets mySQL parameters for the prepared statement
                        MySqlParameter industryIDParam = new MySqlParameter(
                            "industry_id",
                            industryId
                        );

                        // Adds the parameters to the command
                        command.Parameters.Add(industryIDParam);

                        // Call Prepare after setting the Commandtext and Parameters.
                        command.Prepare();

                        // Execute the query and cast the result to a byte array
                        string result = command.ExecuteScalar() as string;

                        // Return the byte array
                        return result;
                    }
                    catch (MySqlException ex)
                    {
                        // Return null if an exception is thrown, may want to implement secure logging
                        Console.WriteLine($"Error executing query: {ex.Message}");
                        throw ex;
                    }
                    finally
                    {
                        // Close the connection at the end
                        dbConnection.CloseConnection();
                    }
                }
            }
            catch (Exception ex)
            {
                // Handle the exception if opening the connection fails
                Console.WriteLine($"Error opening connection: {ex.Message}");
                return null;
            }
        }

        internal void CreateRegulator(Regulator regulator)
        {
            //Calls another prepared statement to get the industry ID from the industry name
            int industryId = GetIndustryID(regulator.IndustryName);

            //Set credentials for the user needed
            dbConnection.SetConnectionCredentials(
                Env.GetString("REGULATOR_WRITER_NAME"),
                Env.GetString("REGULATOR_WRITER_PASSWORD")
            );
            //uses mySqlConnection to open the connection and throws an exception if it fails
            using (MySqlConnection connection = dbConnection.OpenConnection())
            {
                try
                {
                    //creates an instance of MySqlCommand, a method in the mysql library
                    MySqlCommand command = new MySqlCommand(null, connection);

                    // Create and prepare an SQL statement.
                    command.CommandText =
                        $"INSERT INTO regulators (regulator_name, password, public_key, industry_id) VALUES (@userName, @hash, @publicKey, @industry_id)";

                    // Sets a mySQL parameter for the prepared statement
                    MySqlParameter userNameParam = new MySqlParameter("userName", regulator.UserName);
                    MySqlParameter hashParam = new MySqlParameter("hash", regulator.HashedPassword);
                    MySqlParameter publicKeyParam = new MySqlParameter("publicKey", regulator.PublicKey);
                    MySqlParameter industryIDParam = new MySqlParameter("industry_id", industryId);

                    // Adds the parameter to the command
                    command.Parameters.Add(userNameParam);
                    command.Parameters.Add(hashParam);
                    command.Parameters.Add(publicKeyParam);
                    command.Parameters.Add(industryIDParam);

                    // Call Prepare after setting the Commandtext and Parameters.
                    command.Prepare();

                    // Execute the query and cast the result to a boolean
                    command.ExecuteNonQuery();
                }
                //executes at the end, no matter if it returned a value before or not
                finally
                {
                    //closes the connection at the VERY end
                    dbConnection.CloseConnection();
                }
            }
        }

        internal bool UserExists(string userName)
        {
            dbConnection.SetConnectionCredentials(Env.GetString("OTHER_READER_NAME"), Env.GetString("OTHER_READER_PASSWORD"));

            using (MySqlConnection connection = dbConnection.OpenConnection())
            {
                try
                {
                    //creates an instance of MySqlCommand, a method in the mysql library
                    MySqlCommand command = new MySqlCommand(null, connection);

                    // Create and prepare an SQL statement.
                    command.CommandText =
                        $"SELECT CASE WHEN EXISTS (SELECT 1 FROM regulators WHERE regulator_name = @userName) THEN 1 ELSE 0 END";

                    // Sets a mySQL parameter for the prepared statement
                    MySqlParameter userNameParam = new MySqlParameter("@userName", userName);

                    // Adds the parameter to the command
                    command.Parameters.Add(userNameParam);

                    // Call Prepare after setting the Commandtext and Parameters.
                    command.Prepare();

                    // Execute the query and cast the result to a long
                    long result = (long)command.ExecuteScalar();

                    // Convert the long result to boolean
                    bool userExists = result == 1;

                    return userExists;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error executing query: {ex.Message}");
                    return false;

                }
                finally
                {
                    Console.WriteLine("Closing connection...");
                    dbConnection.CloseConnection();
                    Console.WriteLine("Connection closed.");
                }
            }
        }

        //Gets userId from userName
        internal int GetUserID(string industryName)
        {
            //Calls another prepared statement to get the industry ID from the industry name
            int industryId = GetIndustryID(industryName);

            try
            {
                // Set credentials for the user needed
                dbConnection.SetConnectionCredentials(
                    Env.GetString("OTHER_READER_NAME"),
                    Env.GetString("OTHER_READER_PASSWORD")
                );

                // Use MySqlConnection to open the connection and throw an exception if it fails
                using (MySqlConnection connection = dbConnection.OpenConnection())
                {
                    Console.WriteLine("Connection opened successfully.");

                    try
                    {
                        // Query to get industry_id based on industryName
                        string industryIdQuery =
                            "SELECT regulator_id FROM regulators WHERE industry_id = @industryId";

                        // Create and prepare an SQL statement for industry_id
                        MySqlCommand userIdCommand = new MySqlCommand(
                            industryIdQuery,
                            connection
                        );

                        userIdCommand.Parameters.AddWithValue("@industryId", industryId);

                        userIdCommand.Prepare();

                        // Execute the query to get industry_id
                        int userId = Convert.ToInt32(userIdCommand.ExecuteScalar());

                        return userId;
                    }
                    catch (InvalidOperationException ex)
                    {
                        Console.WriteLine($"Error preparing command: {ex.Message}");
                        throw;
                    }
                    catch (MySqlException ex)
                    {
                        // Handle the exception (e.g., log it) and rethrow
                        Console.WriteLine($"Error executing query: {ex.Message}");
                        throw; // Rethrow the caught exception
                    }
                    finally
                    {
                        // Close the connection at the end
                        dbConnection.CloseConnection();
                        Console.WriteLine("Connection closed.");
                    }
                }
            }
            catch (Exception ex)
            {
                // Handle the exception if opening the connection fails
                Console.WriteLine($"Error opening connection: {ex.Message}");
                throw; // Rethrow the caught exception
            }
        }

        internal List<Report> RetrieveReports(string industryName)
        {
            List<Report> reports = new List<Report>();

            //Calls another prepared statement to get the industry ID from the industry name
            int industryId = GetIndustryID(industryName);

            // Set credentials for the user needed
            dbConnection.SetConnectionCredentials(
                Env.GetString("REPORT_READER_NAME"),
                Env.GetString("REPORT_READER_PASSWORD")
            );

            // Use mySqlConnection to open the connection and throw an exception if it fails
            using (MySqlConnection connection = dbConnection.OpenConnection())
            {
                try
                {
                    // Create an instance of MySqlCommand
                    MySqlCommand command = new MySqlCommand(null, connection);

                    // Create and prepare an SQL statement.
                    command.CommandText = "SELECT * FROM reports WHERE industry_id = @industry_id";

                    // Set mySQL parameters for the prepared statement
                    MySqlParameter industryIDParam = new MySqlParameter("industry_id", industryId);
                    command.Parameters.Add(industryIDParam);

                    // Execute the query
                    using (MySqlDataReader reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            // Read data from the database and create a Report object
                            int reportID = reader.GetInt32("report_id");
                            string companyName = reader.GetString("company_name");
                            string description = reader.GetString("description");
                            string email = reader.IsDBNull(reader.GetOrdinal("email")) ? null : reader.GetString("email");
                            string key = reader.GetString("key");
                            string iv = reader.GetString("iv");
                            string salt = reader.GetString("salt");

                            Report report = new Report(
                                reportID,
                                industryName,
                                companyName,
                                description,
                                email,
                                key,
                                iv,
                                salt
                            );
                            reports.Add(report);
                        }
                    }

                    // Return the list of reports
                    return reports;
                }
                catch (MySqlException ex)
                {
                    // Handle the exception (e.g., log it) and return an empty list or null
                    // You may want to implement secure logging to store the error message
                    return new List<Report>();
                }
                finally
                {
                    // Close the connection at the end
                    dbConnection.CloseConnection();
                }
            }
        }


        /*
         * Takes an object of type Report, made using the Report class
         * Tries to takes parameters from the object and sets them as paramaters for the prepared statement
         * Returns true to the function that called it IF it succeds
         * it returns false if it fails/catches an error
         */
        public bool SendReport(Report report)
        {
            //Calls another prepared statement to get the industry ID from the industry name
            DotNetEnv.Env.Load();
            int industryId = GetIndustryID(report.IndustryName);

            try
            {
                // Set credentials for the user needed
                dbConnection.SetConnectionCredentials(
                    Env.GetString("REPORT_WRITER_NAME"),
                    Env.GetString("REPORT_WRITER_PASSWORD")
                );
                // Use mySqlConnection to open the connection and throw an exception if it fails
                using (MySqlConnection connection = dbConnection.OpenConnection())
                {
                    try
                    {
                        // Create an instance of MySqlCommand
                        MySqlCommand command = new MySqlCommand(null, connection);

                        // Create and prepare an SQL statement.
                        command.CommandText =
                            $"INSERT INTO reports (industry_id, company_name, description, email, key, iv, salt) VALUES (@industry_id, @company_name, @description, @email, @key, @iv, @salt)";

                        // Sets mySQL parameters for the prepared statement
                        MySqlParameter industryIDParam = new MySqlParameter(
                            "industry_id",
                            industryId
                        );
                        MySqlParameter companyNameParam = new MySqlParameter(
                            "company_name",
                            report.CompanyName
                        );
                        MySqlParameter descriptionParam = new MySqlParameter(
                            "description",
                            report.Description
                        );
                        MySqlParameter keyParam = new MySqlParameter(
                            "key",
                            report.Key
                        );
                        MySqlParameter IVParam = new MySqlParameter(
                            "iv",
                            report.IV
                        );
                        MySqlParameter saltParam = new MySqlParameter(
                            "salt",
                            report.Salt
                        );

                        // Check if email is null, and set the parameter accordingly
                        MySqlParameter emailParam;
                        if (string.IsNullOrEmpty(report.Email))
                        {
                            emailParam = new MySqlParameter("email", DBNull.Value);
                        }
                        else
                        {
                            emailParam = new MySqlParameter("email", report.Email);
                        }

                        // Adds the parameters to the command
                        command.Parameters.Add(industryIDParam);
                        command.Parameters.Add(companyNameParam);
                        command.Parameters.Add(descriptionParam);
                        command.Parameters.Add(emailParam);
                        command.Parameters.Add(keyParam);
                        command.Parameters.Add(IVParam);
                        command.Parameters.Add(saltParam);

                        // Call Prepare after setting the Commandtext and Parameters.
                        command.Prepare();

                        // Execute the query
                        object result = command.ExecuteScalar();

                        // Return true if no exceptions are thrown
                        return true;
                    }
                    catch (MySqlException ex)
                    {
                        // Handle the exception (e.g., log it) and return false
                        // You may want to implement secure logging to store the error message
                        Console.WriteLine($"Error executing query: {ex.Message}");
                        return false;
                    }
                    finally
                    {
                        // Close the connection at the end
                        dbConnection.CloseConnection();
                        Console.WriteLine("Connection closed.");
                    }
                }
            }
            catch (Exception ex)
            {
                // Handle the exception if opening the connection fails
                Console.WriteLine($"Error opening connection: {ex.Message}");
                return false;
            }
        }

        public string GetHashedPassword(string industryName)
        {
            //Calls another prepared statement to get the industry ID from the industry name
            int industryId = GetIndustryID(industryName);

            //Set credentials for the user needed
            dbConnection.SetConnectionCredentials(
                Env.GetString("OTHER_READER_NAME"),
                Env.GetString("OTHER_READER_PASSWORD")
            );

            //uses mySqlConnection to open the connection and throws an exception if it fails
            using (MySqlConnection connection = dbConnection.OpenConnection())
            {
                try
                {
                    //creates an instance of MySqlCommand, a method in the mysql library
                    MySqlCommand command = new MySqlCommand(null, connection);

                    // Create and prepare an SQL statement.
                    command.CommandText =
                        $"SELECT password FROM regulators WHERE industry_id = @industryId";

                    // Sets a mySQL parameter for the prepared statement
                    MySqlParameter industryIdParam = new MySqlParameter("industry_id", industryId);

                    // Adds the parameter to the command
                    command.Parameters.Add(industryIdParam);

                    // Call Prepare after setting the Commandtext and Parameters.
                    command.Prepare();

                    // Execute the query
                    object result = command.ExecuteScalar();

                    //Casts the result to string
                    string storedHash = result.ToString();

                    //returns the hashed password
                    return storedHash;
                }
                //executes at the end, no matter if it returned a value before or not
                finally
                {
                    //closes the connection at the VERY end
                    dbConnection.CloseConnection();
                }
            }
        }

        public string GetUserName(string industryName)
        {
            //Calls another prepared statement to get the industry ID from the industry name
            int industryId = GetIndustryID(industryName);

            //Set credentials for the user needed
            dbConnection.SetConnectionCredentials(
                Env.GetString("OTHER_READER_NAME"),
                Env.GetString("OTHER_READER_PASSWORD")
            );

            //uses mySqlConnection to open the connection and throws an exception if it fails
            using (MySqlConnection connection = dbConnection.OpenConnection())
            {
                try
                {
                    //creates an instance of MySqlCommand, a method in the mysql library
                    MySqlCommand command = new MySqlCommand(null, connection);

                    // Create and prepare an SQL statement.
                    command.CommandText =
                        $"SELECT regulator_name FROM regulators WHERE industry_id = @industryId";

                    // Sets a mySQL parameter for the prepared statement
                    MySqlParameter industryIdParam = new MySqlParameter("industry_id", industryId);

                    // Adds the parameter to the command
                    command.Parameters.Add(industryIdParam);

                    // Call Prepare after setting the Commandtext and Parameters.
                    command.Prepare();

                    // Execute the query
                    object result = command.ExecuteScalar();

                    //Casts the result to string
                    string username = result.ToString();

                    //returns the hashed password
                    return username;
                }
                //executes at the end, no matter if it returned a value before or not
                finally
                {
                    //closes the connection at the VERY end
                    dbConnection.CloseConnection();
                }
            }
        }


    }
}
