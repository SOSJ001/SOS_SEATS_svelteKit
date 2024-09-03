// @ts-nocheck
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient('https://qwoklzpfoblqmnategny.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2tsenBmb2JscW1uYXRlZ255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIzMDYxMDksImV4cCI6MjAwNzg4MjEwOX0.BktZ0VzqqY5Wn8wjXfgIKBMdNauNx5-ZChMOnw9vbcs')


// login finction
export async function loginbtnFunction(email1, password1) {

    const response = await supabase.auth.signInWithPassword({
        email: email1,
        password: password1,
    });
    return response
}

// Signout function below
export async function signOutbtnFunction() {

    const { error } = await supabase.auth.signOut();

    return {
        SessionFromdb: {
            error
        }
    };

}


export function generateUniqueFilename() {
    const timestamp = Date.now(); // Get the current timestamp
    const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string

    const uniqueFilename = `${timestamp}_${randomString}`; // Combine timestamp and random string

    return uniqueFilename;
}


// load event to the table 
export async function loadEventToTable() {
    let { data: events, error } = await supabase
        .from('event')
        .select('*');

    if (error) {
        console.log("loadEventToTable error", error.message);
        return [];
    }

    // Use Promise.all to await all image requests
    // @ts-ignore
    // @ts-ignore
    const eventWithImages = await Promise.all(events.map(async (Event, i) => {
        const Images = await SelectImagePath(Event.imageId);
        // @ts-ignore
        // console.log('image HERE', Images, i);

        return {
            Event: Event,
            // @ts-ignore
            Image: Images
        };
    }));

    return eventWithImages;
}


// load seat to table function
// @ts-ignore
export async function loadSeatsToTable(EventId) {
    // @ts-ignore
    let { data: seat, error } = await supabase
        .from('seat')
        .select("*")

        // Filters
        .eq('eventid', EventId)

        if(error){
            return null;
        }else{
            return seat;
        }

}

// SELECT IMAGE PATH FROM image Table
// @ts-ignore
async function SelectImagePath(imageId) {
    let { data: image, error } = await supabase
        .from('image')
        .select("*")
        .eq('id', imageId);

    if (error) {
        console.error('Error selecting image path:', error.message);
        return null; // You should handle errors appropriately
    } else {
        // const ImageUrl = await GetImageUrl()
        // console.log('This is the image URL',image[0].fileName);
        // @ts-ignore
        const images = await GetImageUrl(image[0].fileName);
        // console.log('Public url here so ', images)
        return images;

    }

    // return image;
}


// get public url for the Event Image below
// @ts-ignore
async function GetImageUrl(fileName) {
    const { data } = supabase
        .storage
        .from('event_image')//Bucket id
        .getPublicUrl(fileName)

    // console.log('Image Url here so', data.publicUrl);
    return data.publicUrl;
}

export async function refreshsession(refreshTtoken) {
    const { data, error } = await supabase.auth.refreshSession(refreshTtoken)
    const { session, user } = data
    return {
            session
    }
}


// upload image function
// @ts-ignore
async function uploadEventImage(image, userId1) {

    const avatarFile = image.files[0]
    let flyerName = `public/${generateUniqueFilename() + avatarFile.name}`;
    // @ts-ignore
    //uploading the flyer for the event
    console.log("random ", generateUniqueFilename());
    const { data, error } = await supabase
        .storage
        .from('event_image')
        .upload(`${flyerName}`, avatarFile, {
            cacheControl: '3600',
            upsert: false
        })
    if (data) {
        //if the flyer is uploaded successfully insert the flyer name along side the userid into the image table
        const { data, error } = await supabase
            .from('image')
            .insert([
                { fileName: flyerName, userId: userId1 },
            ])
            .select()

        if (data) {
            // console.log("Upload success ", data[0].id);
            const imageId = data[0].id
            return imageId;
        } else {
            console.log("Insert Image Error ", error.message);

        }

    } else {
        // return {
        console.log("Error Uploading Image ", error.message);

        // };
    }
}


// insert event function below
// @ts-ignore
export async function addEventFunction(eName, eDate, eVenue, Audience, file_input, userId) {
    // upload the image first on success insert the event records
    const imageId = await uploadEventImage(file_input, userId); 
    console.log("here so", imageId)


    // @ts-ignore 
    const { data, error } = await supabase
        .from('event')
        .insert([
            { name: eName, date: eDate, venue: eVenue, audience: Audience, imageId: imageId, user_id: userId },
        ])
        .select()

    if (error) {
        console.log(error?.message)
        return error?.message
    } else {
        console.log(data);
        console.log("successfully inserted");
        return data
        
    }
}