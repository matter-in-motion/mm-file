# Matter In Motion. File uploads and processing resource extension

[![NPM Version](https://img.shields.io/npm/v/mm-file.svg?style=flat-square)](https://www.npmjs.com/package/mm-file)
[![NPM Downloads](https://img.shields.io/npm/dt/mm-file.svg?style=flat-square)](https://www.npmjs.com/package/mm-file)

This extension adds a __file__ resource.

## Usage

[Extensions installation instructions](https://github.com/matter-in-motion/mm/blob/master/docs/extensions.md). It validates file type **before** downloading file.

## File upload

You can upload files via [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData).

## Settings

* defaults — object, any default options. Will be applied to the jobs.
* **<jobname>** — object, job declaration
  - path — string, relative to the `root` path to save files to
  - limit — number, maximum files to be accepted
  - **accept** — array, list of the mime types accepted by this job
  - **do** — array, list of action to be applied to each file
    + `{ 'processor:action': {options}}` — action with its options.

Settings example:

```js
this.file = {
  defaults: {
    root: this.join('static', 'uploads') // files storage root.
  },

  test: {
    path: '{year}'
    accept: [
      'image/jpeg'
    ],
    do: [
      { 'fs:copy': { name: 'copy', to: '{filename}_{copy}{_#}{ext}' } },
    ]
  }
};
```

### Processor action options

All actions have only two common

### Path patterns

The following curly bracket variables can be used in the `path` and `to` options

* fieldname — field name from form data
* filename — original file name
* ext — original file extension
* name — action name
* year — four digits year
* month —  the padded _(ex. 01)_ number, 1-based
* day —  the padded number, 1-based
* # — unique file pattern [read more about it here](https://github.com/velocityzen/fsu)

plus any data that particular processor accepts with the files.

## Safe

All generated file paths and names are sanitized. You can upload files with names in any encoding supported by JavaScript.

## File processors

* __fs__ — built-in processor with the following methods:
  - __copy__ copies file
  - __move__ moves file
  - __delete__ deletes file
* __[image](https://github.com/matter-in-motion/mm-file-image)__ — super fast image processor __with animated GIF support__

For processors methods and options go to processors docs.

## API

### process

Processes the file or files with the job

**Request**

All files and any other data should be sent as [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData).

* **job** — job name to use for files

**Respond**

Depends on the processors used in the job.

License: MIT.
