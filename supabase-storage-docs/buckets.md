Storage Buckets

Buckets allow you to keep your files organized and determines the Access Model for your assets. Upload restrictions like max file size and allowed content types are also defined at the bucket level.

Access model#
There are 2 access models for buckets, public and private buckets.

Private buckets#
When a bucket is set to Private all operations are subject to access control via RLS policies. This also applies when downloading assets. Buckets are private by default.

The only ways to download assets within a private bucket is to:

Use the download method by providing a authorization header containing your user's JWT. The RLS policy you create on the storage.objects table will use this user to determine if they have access.
Create a signed URL with the createSignedUrl method that can be accessed for a limited time.
Example use cases:#
Uploading users' sensitive documents
Securing private assets by using RLS to set up fine-grain access controls
Public buckets#
When a bucket is designated as 'Public,' it effectively bypasses access controls for both retrieving and serving files within the bucket. This means that anyone who possesses the asset URL can readily access the file.

Access control is still enforced for other types of operations including uploading, deleting, moving, and copying.

Example use cases:#
User profile pictures
User public media
Blog post content
Public buckets are more performant than private buckets since they are cached differently.

