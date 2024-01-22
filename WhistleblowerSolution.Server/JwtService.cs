using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DotNetEnv;
using Microsoft.IdentityModel.Tokens;
using WhistleblowerSolution.Server.Database;

namespace WhistleblowerSolution.Server
{
    public class JwtService
    {
        private readonly string secretKey;
        private readonly PreparedStatements ps;

        public JwtService()
        {
            // Load environment variables from the .env file
            Env.Load();

            // Retrieve the secret key from the environment variables
            secretKey = Env.GetString("Secret_Key");

            ps = PreparedStatements.CreateInstance();
        }

        internal string GenerateToken(string industryName)
        {
            Env.Load();

            if (industryName == null)
            {
                throw new ArgumentNullException(
                    nameof(industryName),
                    "Industry name cannot be null."
                );
            }
            //generates key for for credentials
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            // Create SigningCredentials using the SymmetricSecurityKey and HMAC-SHA256 algorithm
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            //Content that the client can unpack from the JWT
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.UniqueName, industryName),
                new Claim("userId", ps.GetUserID(industryName).ToString()),
                new Claim("industryId", ps.GetIndustryID(industryName).ToString())
            };

            var token = new JwtSecurityToken(
                //Sets the issuer of the JWT token, this has to match the ValidIssuer from program.cs
                issuer: "WhistleblowerSolution",
                //Sets the audience of the JWT token, this has to match the ValidAudience from program.cs
                audience: "Regulators",
                //sets the claims to what was added in the "claims" earlier
                claims: claims,
                // Token expiration time
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
