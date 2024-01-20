import { useEffect, useState } from "react";
import "./BrowseReports.css";

export default function Reports() {
  const [decryptedReports, setDecryptedReports] = useState([]);

  useEffect(() => {
    // Add event listener for beforeunload
    window.addEventListener("beforeunload", () => {
      // Clears sessionStorage on any sort of navigation away from the page, so that the user has to log in again whenever they navigate away.
      sessionStorage.clear();
    });

    // Fetch reports from the database
    fetchReports();

    // Cleanup
    return () => {
      // Remove event listener when the component unmounts
      window.removeEventListener("beforeunload", () => {});
    };
  }, []);

  const host = "http://localhost:5090/";

  const fetchReports = async () => {
    const industry = sessionStorage.getItem("Industry");
    const user = sessionStorage.getItem("User");
    try {
      const response = await fetch(`${host}api/Report/getReports/${industry}`, {
        method: "GET",
        headers: {
          "name-Header": user,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };


  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            <th className="narrowcolumn">Industry</th>
            <th className="narrowcolumn">Employer</th>
            <th className="widecolumn">Description</th>
          </tr>
        </thead>
        <tbody>
          {decryptedReports.map((report) => (
            <tr key={report.id}>
              <td className="column">{report.industryName}</td>
              <td className="column">{report.companyName}</td>
              <td className="column">{report.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
