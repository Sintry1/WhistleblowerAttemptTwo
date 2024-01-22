import JSEncrypt from "jsencrypt";
import { useState } from "react";
import bcrypt from "bcryptjs";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [industry, setIndustry] = useState("");

  const navigate = useNavigate();

  const host = "http://localhost:5241/";

  const encrypt = new JSEncrypt({ default_key_size: 2048 });

  const checkPassword = async (password, industry) => {
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
    return bcrypt.compareSync(password, data.hashedPassword);
  };

  const checkUsername = async (username, industry) => {
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
      // Prompt user to upload file contents
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".txt"; // Specify the accepted file type(s) here
      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          // Process the file contents here
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const usernameMatch = await checkUsername(username, industry);
      // Check if user exists
      if (!usernameMatch) {
        throw new Error("Username does not match");
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

      if (response.ok) {
        const data = await response.json();
        Cookies.set("JWT", data.token);
      }
      navigate("/reports");
      // if password matches, login by redirecting to reports page
      // when redirected to reports page, pass industry and username in sessionStorage
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
