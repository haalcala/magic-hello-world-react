import React, { useEffect, useState, useCallback } from "react";
import { useHistory } from "react-router";

const { BN, Long, bytes, units } = require("@zilliqa-js/util");
const { toBech32Address } = require("@zilliqa-js/crypto");
const { Zilliqa } = require("@zilliqa-js/zilliqa");
const { StatusType, MessageType } = require("@zilliqa-js/subscriptions");

import { magic } from "../magic";
import Loading from "./Loading";

export default function Profile() {
  const [userMetadata, setUserMetadata] = useState();
  const history = useHistory();

  const [appleCount, setAppleCount] = useState(0);

  useEffect(() => {
    // On mount, we check if a user is logged in.
    // If so, we'll retrieve the authenticated user's profile.
    magic.user.isLoggedIn().then((magicIsLoggedIn) => {
      if (magicIsLoggedIn) {
        magic.user.getMetadata().then(setUserMetadata);

        fetch("/api/v1/user", {
          // headers: new Headers({
          //   Authorization: "Bearer " + didToken
          // }),
          withCredentials: true,
          credentials: "same-origin",
        }).then(async (resp) => {
          const user = await resp.json();

          if (resp.status != 200) {
            history.push("/login");
            return;
          }

          console.log("user:", user);

          setAppleCount(user.appleCount);
        });
      } else {
        // If no user is logged in, redirect to `/login`
        history.push("/login");
      }
    });
  }, []);

  useEffect(() => {
    (async () => {})();

    return () => {};
  }, []);

  /**
   * Perform logout action via Magic.
   */
  const logout = useCallback(() => {
    magic.user.logout().then(() => {
      history.push("/login");
    });
  }, [history]);

  const handleBuyApple = useCallback(async () => {
    const resp = await fetch(`/api/v1/user/buy-apple`, { method: "POST" });

    const user = await resp.json();

    setAppleCount(user.appleCount);
  });

  async function connectZilpay() {
    try {
      await window.zilPay.wallet.connect();

      if (window.zilPay.wallet.isConnect) {
        localStorage.setItem("zilpay_connect", true);
        window.location.reload(false);


      } else {
        alert("Zilpay connection failed, try again...");
      }
    } catch (error) {}
  }

  async function bindWalletAddressToAccount() {
    const resp = await fetch("/api/v1/user/wallet", {
                withCredentials: true,
          credentials: "same-origin",
      method:"POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ wallet_address: window.zilPay.wallet.defaultAccount.bech32 }),
    });

    const data = await resp.json()

    console.log("data:", data)
}

  console.log("window.zilPay.wallet:", window.zilPay.wallet);

  return userMetadata ? (
    <div className="container">
      <h1>Current user: {userMetadata.email}</h1>
      <h1>Apple Count: {appleCount > 0 ? "🍎".repeat(appleCount) : "You have no apples..."}</h1>
      <button onClick={handleBuyApple}>Buy an apple</button>
      <button onClick={logout}>Logout</button>
      {!localStorage.getItem("zilpay_connect") ? <button onClick={connectZilpay}>Connect Zilpay</button> : (<h4>Wallet Address: {window.zilPay.wallet.defaultAccount.bech32}<button onClick={bindWalletAddressToAccount}>Bind wallet address</button></h4> )}
    </div>
  ) : (
    <Loading />
  );
}
