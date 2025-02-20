Well, the question comes on how to use it.
First, you git clone the entire repo.
Next, you cd to the directory of the repo.
Next, you type node server.js.
Then, you click on the UI option (w/ port 2047).
Finally, you could use the app.

By the way, if you want to make this accessible in your local network, the whole point of this I guess, (e.g. the one given to your devices by your router starting with 192.168.0.0/16, 172.16.0.0/12, 10.0.0.0/8 etc.), you would need to allow traffic (inbound) through the ports 2047 and 8191 (I have no apparent reason for choosing these; I guess it is because they are either a Mersenne Composite or Mersenne Prime number).
    For Linux (Debian), this is rather easy; you just need to sudo ufw allow 2047 and sudo ufw allow 8191.
    For Windows, you would need to go to firewall settings and allow inbound traffic from these two ports with TCP in the local network.
To access the ui, you simply type http://(machine you are running the ws server on):2047 on a machine under the same router.