Serving assets from Storage

Serving assets from Storage

Public buckets#
As mentioned in the Buckets Fundamentals all files uploaded in a public bucket are publicly accessible and benefit a high CDN cache HIT ratio.

You can access them by using this conventional URL:

https://[project_id].supabase.co/storage/v1/object/public/[bucket]/[asset-name]
You can also use the Supabase SDK getPublicUrl to generate this URL for you

const { data } = supabase.storage.from('bucket').getPublicUrl('filePath.jpg')
console.log(data.publicUrl)
Downloading#
If you want the browser to start an automatic download of the asset instead of trying serving it, you can add the ?download query string parameter.

By default it will use the asset name to save the file on disk. You can optionally pass a custom name to the download parameter as following: ?download=customname.jpg

Private buckets#
Assets stored in a non-public bucket are considered private and are not accessible via a public URL like the public buckets.

You can access them only by:

Signing a time limited URL on the Server, for example with Edge Functions.
with a GET request the URL https://[project_id].supabase.co/storage/v1/object/authenticated/[bucket]/[asset-name] and the user Authorization header
Signing URLs#
You can sign a time-limited URL that you can share to your users by invoking the createSignedUrl method on the SDK.

const { data, error } = await supabase.storage
  .from('bucket')
  .createSignedUrl('private-document.pdf', 3600)
if (data) {
  console.log(data.signedUrl)
}