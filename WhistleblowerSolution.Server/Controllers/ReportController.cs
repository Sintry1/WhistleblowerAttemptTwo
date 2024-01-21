using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhistleblowerSolution.Server.Database;
using static Mysqlx.Error.Types;

namespace WhistleblowerSolution.Server.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : Controller
    {
        private readonly PreparedStatements ps;

        public ReportController()
        {
            // Instantiate the Security class when creating the controller
            ps = PreparedStatements.CreateInstance();
        }

        [HttpPost("sendReport")]
        [AllowAnonymous]
        public IActionResult SendReport([FromBody] Report reportRequest)
        {
            try
            {
                
                bool result = ps.SendReport(reportRequest);

                if (result)
                {
                    return Ok(new { Success = true, Message = "Report sent successfully." });
                }
                else
                {
                    return BadRequest(new { Success = false, Message = "Failed to send the report." });
                }
            }
            catch (Exception ex)
            {
                // Log the exception for debugging purposes
                return StatusCode(500, new { Success = false, Message = "Internal server error." });
            }
        }
    }
}
