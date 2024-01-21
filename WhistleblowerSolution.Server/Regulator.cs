namespace WhistleblowerSolution.Server
{
    public class Regulator
    {
        // Properties
        public string UserName { get; private set; }
        public string HashedPassword { get; private set; }
        public string IndustryName { get; private set; }
        public string PublicKey { get; private set; }

        // Constructor
        public Regulator(string userName, string hashedPassword, string industryName, string publicKey)
        {
            UserName = userName;
            HashedPassword = hashedPassword;
            IndustryName = industryName;
            PublicKey = publicKey;   
        }
    }

}
