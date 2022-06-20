# URLS4IRL

## Share URLs With People You Know!

Ever shared a link with someone and then tried to search your chat history to find it again?

Ever wanted to share a bunch of your important URLs with all of your coworkers simultaneously?

URLS4IRL was born with the idea to be able to easily share URLs with friends, coworkers, or yourself, all within a single web app. 

It allows each user to create one or many UTubs (URL Tubs) where they can:
- Add/remove URLs
- Add/remove other users
- Add tags to each URL
- Add descriptions to each UTub, and notes to each URL
- Chat with other users in their UTub

It is built with Flask, and uses a SQLite database with an eye towards migrating to a PostgreSQL
database in the future.

This is my first web app and I am excited to share it with the world! Come watch it grow!


###### tags: `URLs`, `Flask`, `Python`, `HTML`, `CSS`, `Javascript`, `SQLite`, `PostgreSQL`, `jQuery` 

## :memo: TODO - Getting the Product :arrow_right: IRL :arrow_left: (Into Real Life)!
> In no particular order

- [ ] **Frontend** 
    - [ ] Show all members of a UTub
    - [ ] Make frontend AJAX call to add URLs to a UTub
    - [ ] Show URLs in a UTub filtered on user selected tag or tags
    - [ ] Tidy up homepage
- [ ] **Backend** 
    - [ ] Migrating SQLite to PostgreSQL
    - [ ] RestAPI development to lead into mobile app development
- [ ] Error routing/Custom error page
- [ ] Email confirmation/registration
- [ ] Instant messaging system per UTub
- [ ] Hosting this on Heroku
- [ ] User account customization
- [ ] A license!
- [ ] User customization (profile pictures?)


## :rocket: Completed
> Also in no particular order

- [x] **Frontend (So Far)** 
    - [x] Splash page for visitors who aren't logged in
    - [x] Login/Registration modals 
    - [x] Logout functionality
    - [x] Home page shows first selected UTub's URLs and tags
    - [x] Asynchronously loads another UTub based on user selection
    - [x] User can add a UTub
    - [x] User can remove a URL
- [x] **Backend (So Far)** 
    - [x] Backend routing for basic User/UTub/URLs/Tag functionalities
    - [x] Correct permissions for certain events:
        - [x] Only see a UTub you are a part or you have made
        - [x] Delete a UTub only if you have made it
        - [x] Delete a URL only if you are the UTub owner, or you added the URL
        - [x] Remove a UTub member if you are the UTub owner
        - [x] Remove yourself from a UTub
        - [x] Remove tags on a URL only if you are the owner of the UTub
    - [x] Commonizing of URLs to avoid duplicates
    - [x] Verification that the URL is valid
    - [x] Database tables with all many-to-many relationships considered
    - [x] Login/Logout/Registration capability
