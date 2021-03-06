# Greasemonkey/GreaseKit extensions for 37signal's Highrise

## WARNING

Currently only working on GreaseKit (Safari or Fluid apps) - I think Greasemonkey + Prototype (being reused from highrisehq.com) aren't coexisting nicely.

## Description

A set of extensions to the Highrise CRM by 37signals:

* within contact information, phone numbers converted to callto:// links to enable access to Skype/VOIP apps

<img src="http://img.skitch.com/20080826-1e34ar1x8xmsfe4rh45g39dqiy.jpg" alt="highrise-greasemonkey - phone numbers converted to callto: links" />

* Skype IM username converted to skype: link.

<img src="http://img.skitch.com/20080826-p39n7jr3nb2u2jfb43r9gi84x7.jpg" alt="highrise-greasemonkey - skype links"/>

## Todo / Issues

* User-defined home international prefix (e.g. +61 for Australia or +1 for USA)
* Auto-assign some values (such as Country) on New Contact/Company form
* On contact page, show other contacts for the same company (using Jester for RESTful access)
* Dashboard (or any notes list) - support partial + fully collapsed notes list, say like Gmail
* Addresses include Google Maps link or embedded map
* Auto-assign each note a Case, based on the user/company; annoying to have to manually assign Cases
* Person Search - include contact picture within search results

PLUS - as above, make it work on Firefox or raise Greasemonkey/Prototype bug report

META TODO - add rake task to upload new versions to [http://userscripts.org](http://userscripts.org)

## Requirements

For Safari or Fluid.app apps: requires [GreaseKit](http://8-p.info/greasekit/)
For Firefox: requires [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/748)

## Installation

To install to Safari:

    BROWSERS=safari rake install

To install to a Fluid.app wrapper app for Highrise, say called 'Highrise':

    BROWSERS=Highrise rake install

## Unit tests

This extension is developed via TDD javascript unit tests. 

To run all of them against all your locally install browsers:

    rake test_units

Or specific browsers:

    BROWSERS=safari rake test_units

Or load individual test HTML files into a browser, such as `test/unit/highrise_people_test.html` to run those tests.

Or run `script/js_autotest`, modify javascript or HTML test files and the tests will be automatically launched in Safari ([more info](http://drnicwilliams.com/2008/01/04/autotesting-javascript-in-rails/))

## Author

Dr Nic Williams, [http://drnicwilliams.com](http://drnicwilliams.com)
CEO, Mocra, [http://mocra.com](http://mocra.com) - the premier Rails/iPhone SDK consultancy