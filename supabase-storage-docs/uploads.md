Standard Uploads

Learn how to upload files to Supabase Storage.

Uploading#
The standard file upload method is ideal for small files that are not larger than 6MB.

It uses the traditional multipart/form-data format and is simple to implement using the supabase-js SDK. Here's an example of how to upload a file using the standard upload method:

Though you can upload up to 5GB files using the standard upload method, we recommend using TUS Resumable Upload for uploading files greater than 6MB in size for better reliability.


JavaScript

Dart

Swift

Kotlin

Python
import { createClient } from '@supabase/supabase-js'
// Create Supabase client
const supabase = createClient('your_project_url', 'your_supabase_api_key')
// Upload file using standard upload
async function uploadFile(file) {
  const { data, error } = await supabase.storage.from('bucket_name').upload('file_path', file)
  if (error) {
    // Handle error
  } else {
    // Handle success
  }
}
Overwriting files#
When uploading a file to a path that already exists, the default behavior is to return a 400 Asset Already Exists error.
If you want to overwrite a file on a specific path you can set the upsert options to true or using the x-upsert header.


JavaScript

Dart

Swift

Kotlin

Python
// Create Supabase client
const supabase = createClient('your_project_url', 'your_supabase_api_key')
await supabase.storage.from('bucket_name').upload('file_path', file, {
  upsert: true,
})
We do advise against overwriting files when possible, as our Content Delivery Network will take sometime to propagate the changes to all the edge nodes leading to stale content.
Uploading a file to a new path is the recommended way to avoid propagation delays and stale content.

Content type#
By default, Storage will assume the content type of an asset from the file extension. If you want to specify the content type for your asset, pass the contentType option during upload.


JavaScript

Dart

Swift

Kotlin

Python
// Create Supabase client
const supabase = createClient('your_project_url', 'your_supabase_api_key')
await supabase.storage.from('bucket_name').upload('file_path', file, {
  contentType: 'image/jpeg',
})
Concurrency#
When two or more clients upload a file to the same path, the first client to complete the upload will succeed and the other clients will receive a 400 Asset Already Exists error.
If you provide the x-upsert header the last client to complete the upload will succeed instead.

