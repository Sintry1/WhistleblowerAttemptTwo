import { Link } from "react-router-dom";

export default function Information() {
  return (
    <div>
      <h1>Whistleblowers Anonymous</h1>
      <p>
        Whistleblowers Anonymous is a platform for whistleblowers to anonymously
        report on their employers.
      </p>
      <p>
        On the following pages you will be directed to submit your report to
        usanonymously.
      </p>
      <p>
        Before submitting a report with us, please ensure you are following the
        correct whistleblowing procedure
      </p>
      <p>
        For more information on whistleblowing, please visit{" "}
        <a href="https://www.gov.uk/whistleblowing">
          https://www.gov.uk/whistleblowing
        </a>
      </p>
      <button>
        <Link to="/sendreport">Submit a report</Link>
      </button>
      <button>
        <Link to="/login">Regulator Login</Link>
      </button>
    </div>
  );
}
