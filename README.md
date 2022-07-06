# URLS4IRL

## Share URLs With People You Know!

Ever shared a link with someone and then tried to search your chat history to find it again?

Ever wanted to share a bunch of your important URLs with all of your coworkers simultaneously?

URLS4IRL was born with the idea to be able to easily share URLs with friends, coworkers, or yourself, all within a single web app. 

It allows each user to create one or many UTubs (URL Tubs) where they can:
- Add/remove URLs
- Add/remove other users
- Add/remove tags to each URL
- Add descriptions to each UTub, and descriptions to each URL
- Chat with other users in their UTub

It is built with Flask, and uses a SQLite database with an eye towards migrating to a PostgreSQL
database in the future.

This is my first web app and I am excited to share it with the world! Come watch it grow!


###### tags: `URLs`, `Flask`, `Python`, `HTML`, `CSS`, `Javascript`, `SQLite`, `PostgreSQL`, `jQuery` 

## :memo: TODO - Getting the Product :arrow_right: IRL :arrow_left: (Into Real Life)!
> In no particular order

- [ ] **Frontend** 
    - [ ] Filter URLs in a UTub based on user selected tag or tags
    - [ ] Tidy up homepage
    - [ ] Make responsive for mobile devices as well
    - [ ] Allow users to drag and drop URLs or UTubs in a custom order
- [ ] **Backend** 
    - [ ] Migrating SQLite to PostgreSQL
    - [ ] RestAPI development to lead into mobile app development
    - [ ] Allow user to update a URL description
    - [ ] Allow user to update a URL
    - [ ] Allow user to update a UTub description
    - [ ] Create a User-Settings table to store preferences and preferred order of URLs/UTubs
- [ ] Error routing/Custom error page
    - [x] Most http errors are shown in a banner, however 404 will require it's own unique page 
- [ ] Email confirmation/registration
- [ ] Instant messaging system per UTub
- [ ] Hosting this on Heroku
- [ ] User account customization (profile pictures?)
- [ ] A license!


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
    - [x] Show all members of a UTub
    - [x] Make frontend AJAX call to add URLs to a UTub
    - [x] Scrollable Divs for each Panel
    - [x] User can add or remove a tag
    - [x] Each URL is a card that displays all relevant info on click
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

## :hammer: Challenges
- [X] Integrate AJAX requests with Flask-WTF and modals to correctly display user input errors
- [X] Migrate the SQLite database when changes had to be made instead of deleting and recreating the database
- [X] Ensuring correct permissions for actions, i.e. only the creator of a UTub can delete a UTub
- [X] Implementing CRUD operations on nested components
    - i.e. for a tag, on a url, contained in a UTub
