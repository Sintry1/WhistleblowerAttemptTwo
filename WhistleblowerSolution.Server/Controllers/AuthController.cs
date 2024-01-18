using Microsoft.AspNetCore.Mvc;

namespace WhistleblowerSolution.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly JwtService jwtService;

        public AuthController(JwtService jwtService)
        {
            this.jwtService = jwtService;
        }

        [HttpPost("login")]
        public IActionResult Login()
        {

            // Authenticate user, get userId and username
            string userId = "123";
            string username = ps.fetchUserDetails();

            // Generate JWT
            string token = jwtService.GenerateToken(userId, username);

            return Ok(new { token });
        }
    }

}
