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
        internal int GetUserID(string userName)
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
                            "SELECT regulator_id FROM regulators WHERE regulator_name = @userName";

                        // Create and prepare an SQL statement for industry_id
                        MySqlCommand userIdCommand = new MySqlCommand(
                            industryIdQuery,
                            connection
                        );

                        userIdCommand.Parameters.AddWithValue("@userName", userName);

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

        //Gets the industry ID related to the given user with the username passed
        internal int GetUserIndustryID(string userName)
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
                            "SELECT industry_id FROM regulators WHERE regulator_name = @userName";

                        // Create and prepare an SQL statement for industry_id
                        MySqlCommand userIndustryIdCommand = new MySqlCommand(
                            industryIdQuery,
                            connection
                        );

                        userIndustryIdCommand.Parameters.AddWithValue("@userName", userName);

                        userIndustryIdCommand.Prepare();

                        // Execute the query to get industry_id
                        int userIndustryId = Convert.ToInt32(userIndustryIdCommand.ExecuteScalar());

                        return userIndustryId;
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
                            string companyIv = reader.GetString("company_iv");
                            string description = reader.GetString("description");
                            string descIv = reader.GetString("desc_iv");
                            string email = reader.IsDBNull(reader.GetOrdinal("email")) ? null : reader.GetString("email");

                            Report report = new Report(
                                reportID,
                                industryName,
                                companyName,
                                companyIv,
                                description,
                                descIv,
                                email
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


    }
}
