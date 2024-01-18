namespace WhistleblowerSolution.Server
{
    public class Report
    {
        public int? ReportID { get; set; }
        public string IndustryName { get; set; }
        public string CompanyName { get; set; }
        public string Description { get; set; }
        public string Email { get; set; }
        public string Key { get; set; }
        public string IV { get; set; }
        public string Salt { get; set; }

        // Constructor with parameters
        public Report(int? reportID, string industryName, string companyName, string description, string email, string key, string iv, string salt)
        {
            ReportID = reportID;
            IndustryName = industryName;
            CompanyName = companyName;
            Description = description;
            Email = email;
            Key = key;
            IV = iv;
            Salt = salt;
        }
    }

}
