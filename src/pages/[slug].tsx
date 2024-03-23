import { type NextApiRequest } from 'next';
import { db } from '~/server/db';
import Head from "next/head";



export async function getServerSideProps(request: NextApiRequest) {
    const slug = request.query.slug as string;
    
    const url = await db.link.findUnique({
        where: {
          slug,
        },
      });
  
      if (!url) {
        // return {
        //   redirect: {
        //     destination: '/',
        //     permanent: false,
        //   },
        // };

        return {
            props: {
                slug,
                notFound: true
            }
        }
      }
  

    
    return {
      redirect: {
        destination: url.url,
      }
    }

return {props: {
    slug
}}
}


export default function Redirect({slug, notFound} : {slug: string, notFound: boolean}) {

    // console.log(slug)
    // console.log(notFound)

    if (!!slug && !notFound) {
        return (
            <div>
                <h1>Redirecting...</h1>
            </div>
        )
    }

    return (
        <>
          <Head>
            <title>mylinks | dashboard</title>
            <meta name="description" content="Link sharing website" />
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <div className="min-h-screen bg-zinc-950">
    
   
          </div>
        </>
      );
}