

* The main site should have a simple upload form (with a password).
* There should be an API such that I could implement it with greenshot.
	* I could use curl via configure external commands.
* Need to create a separate application so that I can upload to website (or use curl?)
* All metadata should be stripped off the image.
* Only allow image formats
* Images will get a random 4 character length character string with numbers and letter in lower case.
	* Would allow for 1.6 million images which is FAR more than what I need.
		* 1.6 million images stored at approx 6MB each would be over 9 TB.
* Install script to automatically install it, with a systemd conf file.

