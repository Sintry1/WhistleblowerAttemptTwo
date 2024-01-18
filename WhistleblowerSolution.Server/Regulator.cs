namespace WhistleblowerSolution.Server
{
    public class Regulator
    {
        // Properties
        public string UserName { get; private set; }
        public string HashedPassword { get; private set; }
        public string PublicKey { get; private set; }
        public string IndustryName { get; private set; }

        // Constructor
        public Regulator(string userName, string hashedPassword, string publicKey, string industryName)
        {
            UserName = userName;
            HashedPassword = hashedPassword;
            PublicKey = publicKey;
            IndustryName = industryName;
        }
    }

}
