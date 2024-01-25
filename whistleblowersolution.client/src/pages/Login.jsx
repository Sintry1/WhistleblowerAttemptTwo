import JSEncrypt from "jsencrypt";
import { useState } from "react";
import bcrypt from "bcryptjs";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export default function Login() {
  // useState hooks are used to manage state in functional components.
  const [username, setUsername] = useState(""); // State for username
  const [password, setPassword] = useState(""); // State for password
  const [industry, setIndustry] = useState(""); // State for industry

  // useNavigate hook from react-router-dom is used for navigation.
  const navigate = useNavigate();

  // Initialize JSEncrypt for encryption and decryption.
  const host = "http://localhost:5241/";

  // Initialize JSEncrypt for encryption and decryption.
  const encrypt = new JSEncrypt({ default_key_size: 2048 });

  // Function to check if the entered password matches the stored password
  const checkPassword = async (password, industry) => {
    // Fetch the stored hashed password from the API.
    const storedPassword = await fetch(
      `${host}api/Regulator/PasswordCheck/${industry}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await storedPassword.json();
    // Compare the entered password with the stored password using bcrypt.
    return bcrypt.compareSync(password, data.hashedPassword);
  };

  // Function to check if the entered username matches the stored username.
  const checkUsername = async (username, industry) => {
    // Fetch the stored username from the API.
    const storedUsername = await fetch(
      `${host}api/Regulator/GetUserName/${industry}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await storedUsername.json();

    // Wrap the file reading operation in a Promise
    return new Promise((resolve, reject) => {
      // Create a file input element to prompt the user to upload a file.
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".txt"; // Specify the accepted file type(s) here
      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          // Create a FileReader to read the contents of the file.
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContents = e.target.result;
            // Set the private key with the file contents
            encrypt.setPrivateKey(fileContents);
            // Decrypt the username after setting the private key
            const decryptedUsername = encrypt.decrypt(data.userName);
            // Compare the decrypted username with the input username
            resolve(username === decryptedUsername);
          };
          reader.readAsText(file);
        } else {
          reject(new Error("Failed to load file"));
        }
      });
      fileInput.click();
    });
  };

  // Function to handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const usernameMatch = await checkUsername(username, industry);
      // Check if user exists
      if (!usernameMatch) {
        throw new Error("There was an error logging in, please try again");
      }

      const passwordMatch = await checkPassword(password, industry);
      // Check if password matches
      if (!passwordMatch) {
        throw new Error("There was an error logging in, please try again");
      }

      const response = await fetch(`${host}api/Regulator/login`, {
        method: "POST",
        body: JSON.stringify({
          UsernameCheck: usernameMatch,
          PasswordCheck: passwordMatch,
          IndustryName: industry,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // If the response is OK, set the JWT token in the cookies.
      if (response.ok) {
        const data = await response.json();
        Cookies.set("JWT", data.token);
      }
      // Navigate to the reports page.
      navigate("/reports");
      
    } catch (err) {
      console.log(err);
    }
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <select id="industry" onChange={(e) => setIndustry(e.target.value)}>
          <option value="">Select Industry</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Financial Services">Financial Services</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Law Enforcement">Law Enforcement</option>
          <option value="Leisure">Leisure</option>
          <option value="Hospitality">Hospitality</option>
        </select>
        <button type="submit">Login</button>
      </form>
      <button>
        <Link to="/register">Register</Link>
      </button>
    </div>
  );
}
