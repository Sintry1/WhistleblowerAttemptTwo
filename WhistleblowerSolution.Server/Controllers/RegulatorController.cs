using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhistleblowerSolution.Server.Database;

namespace WhistleblowerSolution.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegulatorController : Controller
    {
        private readonly JwtService jwtService;
        private readonly PreparedStatements ps;

        public RegulatorController()
        {
            // Instantiate the Security class when creating the controller
            ps = PreparedStatements.CreateInstance();
            jwtService = new JwtService();
        }

        [HttpGet("GetPublicKey/{industryName}")]
        [AllowAnonymous]
        public IActionResult GetPublicKey(string industryName)
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
        [AllowAnonymous]
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

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest loginRequest)
        {

            // Check if the provided username matches a predefined value
            if (loginRequest.UsernameCheck)
            {

                if (loginRequest.PasswordCheck)
                {

                    // Generate a JWT token for the authenticated user
                    var token = jwtService.GenerateToken(loginRequest.IndustryName);

                    return Ok(new { Token = token });
                }
                else
                {
                    Console.WriteLine("Password check failed");
                    return Unauthorized("invalid credentials");
                }
            }
            else
            {
                Console.WriteLine("Username check failed");
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

        [HttpGet("PasswordCheck/{industryName}")]
        [AllowAnonymous]
        public IActionResult GetPassword(string industryName)
        {
            try
            {
                string hashedPassword = ps.GetHashedPassword(industryName);

                return Ok(new { Success = true, HashedPassword = hashedPassword });
            }
            catch (Exception ex)
            {
                // Log the exception for debugging purposes
                return StatusCode(500, new { Success = false, Message = "Internal server error." });
            }
        }

        [HttpGet("GetUserName/{industryName}")]
        [AllowAnonymous]
        public IActionResult GetUserName(string industryName)
        {
            try
            {
                string username = ps.GetUserName(industryName);

                return Ok(new { Success = true, UserName = username });
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
        public bool UsernameCheck { get; set; }
        public bool PasswordCheck { get; set; }
        public string IndustryName { get; set; }
    }
}
