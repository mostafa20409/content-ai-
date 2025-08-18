// app/profile/page.tsx
export default function Profile() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">بروفايلي</h1>
      <img 
        src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
        alt="صورة بروفايل"
        width={100}
        height={100}
        className="rounded-full mt-4"
      />
    </div>
  );
}