import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Mfa.css";

export default function Mfa() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    const [serverResponse, setServerResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setServerResponse(null);
        setLoading(true);

        try {
            const res = await fetch("/api/login/mfa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ code })
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok || json.status !== "success") {
                setServerResponse(json.message || "Invalid code.");
                return;
            }

            navigate("/dashboard");
        } catch (err) {
            console.error("MFA submit error:", err);
            setServerResponse("Failed to verify MFA.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="mfa-page">
                <div className="mfa-wrapper">
                    <form className="mfa-form" onSubmit={submit}>
                        <h1>Enter MFA Code</h1>

                        <input
                            type="text"
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />

                        <button type="submit" disabled={loading}>
                            {loading ? "Verifying..." : "Verify"}
                        </button>

                        {serverResponse && <p className="server-response">{serverResponse}</p>}
                    </form>
                </div>
            </div>
        </>
    );
}