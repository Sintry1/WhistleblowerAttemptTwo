using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhistleblowerSolution.Server.Database;

namespace WhistleblowerSolution.Server.Controllers
{
    public class RegulatorController : Controller
    {
        private readonly JwtService jwtService;
        private readonly PreparedStatements ps = PreparedStatements.CreateInstance();


        [HttpGet("GetPublicKey/{industryName}")]
        public IActionResult FindIvFromRegulatorIndustryName(string industryName)
        {
            try
            {
                // Destructuring the tuple directly in the method signature
                string publicKey = ps.GetPublicKey(industryName);

                return Ok(new { Success = true, publicKey = publicKey });
            }
            catch (Exception ex)
            {
                // Log the exception for debugging purposes
                return StatusCode(500, new { Success = false, Message = "Internal server error." });
            }
        }


        [HttpPost("createRegulator")]
        public IActionResult CreateRegulator([FromBody] Regulator regulator)
        {
            try
            {
                string userName = regulator.UserName;
                string hashedPassword = regulator.HashedPassword;
                string industryName = regulator.IndustryName;
                string publicKey = regulator.PublicKey;

                ps.CreateRegulator(regulator);

                return Ok(new { Success = true, Message = "Regulator created successfully." });
            }
            catch (Exception ex)
            {
                // Log the exception for debugging purposes
                Console.WriteLine("Exception message: " + ex.Message);
                return StatusCode(500, new { Success = false, Message = "Internal server error." });
            }
        }


        [HttpPost]
        [Route("login")]
        public IActionResult Login([FromBody] LoginRequest loginRequest)
        {
            // Check if the provided username matches a predefined value
            if (ps.UserExists(loginRequest.Username))
            {
                if (loginRequest.BooleanCheck) 
                { 
                    // Generate a JWT token for the authenticated user
                    var token = jwtService.GenerateToken(loginRequest.Username);

                    return Ok(new { Token = token });
                } 
                else
                {
                    return Unauthorized("invalid credentials");
                }
            }
            else
            { 

                // Unauthorized if the username doesn't match
                return Unauthorized("Invalid credentials");
            }
        }


        [HttpGet("getReports/{industryName}")]
        [Authorize]
        public IActionResult RetrieveReports(string industryName)
        {

            try
            {
                string userName = User.FindFirst("unique_name").Value;
                List<Report> reports = ps.RetrieveReports(industryName);

                return Ok(new { Success = true, Reports = reports });
            }
            catch (Exception ex)
            {
                // Log the exception for debugging purposes
                return StatusCode(500, new { Success = false, Message = "Internal server error." });
            }
        }





    }
    public class LoginRequest
    {
        public string Username { get; set; }
        public bool BooleanCheck { get; set; }
    }
}
