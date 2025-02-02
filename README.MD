# Fragma 1.0: Beta

## Installation

Run : `npm install fragmahtml -g`

## Use

Run : `fragma entry.html output.html`

### NOTE

Output file will be saved relative to the directory of the entry file.

## Usage In file

In entry or even content files you can use `<content src="myPath"></content>`. This tag will be substituted by the file contents of the src. The src will be read relative to the file it's mentioned in.