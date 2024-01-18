using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using DotNetEnv;

namespace WhistleblowerSolution.Server
{
    public class JwtService
    {
        private readonly string secretKey;

        public JwtService()
        {
            // Load environment variables from the .env file
            Env.Load();

            // Retrieve the secret key from the environment variables
            secretKey = Env.GetString("secretKey");
        }

        private string GenerateToken(string userId, string username)
        {
            Env.Load();

            var securityKey = new SymmetricSecurityKey(Convert.FromBase64String(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            //Content that the client can unpack from the JWT
            var claims = new[]
            {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.UniqueName, username),
            
        };

            var token = new JwtSecurityToken(
                issuer: "WhistleblowerSolution",
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
