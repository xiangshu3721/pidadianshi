import { redirect } from "next/navigation";

/** Legacy route — chat now lives on `/` */
export default function RecordRedirect() {
  redirect("/");
}
