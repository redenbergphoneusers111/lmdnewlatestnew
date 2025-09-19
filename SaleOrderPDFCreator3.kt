package com.greenflamegas.gogas.UI

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.graphics.*
import android.graphics.pdf.PdfDocument
import android.graphics.pdf.PdfDocument.PageInfo
import android.net.Uri
import android.os.Build
import android.os.Build.VERSION.SDK_INT
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.util.DisplayMetrics
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.LinearLayoutCompat
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.content.FileProvider
import com.greenflamegas.gogas.R
import com.greenflamegas.gogas.database.order.sales.SalesOrderDataSource
import com.greenflamegas.gogas.databinding.ActivitySaleOrderPdfCreatorBinding
import com.greenflamegas.gogas.helpers.PreferenceHelper
import com.greenflamegas.gogas.network.Parser.order.OrderMaterialInfo
import com.greenflamegas.gogas.network.Parser.order.OrderWithMaterialInfoAndOwner
import com.greenflamegas.gogas.network.Parser.order.SalesOrder
import com.greenflamegas.gogas.network.Parser.orderowner.customer.CustomerPricingInfo
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.OutputStream
import java.math.BigDecimal
import java.text.DecimalFormat
import java.util.*


class SaleOrderPDFCreator3 : AppCompatActivity() {
    private var llPdf: LinearLayoutCompat? = null
    private var bitmap: Bitmap? = null
    private var bitmap2: Bitmap? = null // Second bitmap for page 2
    var order: SalesOrder? = null
    private var isCashCustomer = false
    private var deliveryChargeItems: MutableList<OrderMaterialInfo> = mutableListOf()
    private var regularItems: MutableList<OrderMaterialInfo> = mutableListOf()


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_sale_order_pdf_creator2)

//        binding = ActivitySaleOrderPdfCreatorBinding.inflate(layoutInflater)
//        setContentView(binding.root)

        llPdf = findViewById(R.id.print_layout) as LinearLayoutCompat?
        getActionBar()?.hide();
        val orderId = intent.getStringExtra("orderId")

        var orderTitles = intent.getStringExtra("orderTitles")
        var appendValue = intent.getStringExtra("appendValue")
        var orderNumber = intent.getStringExtra("orderNumber")

        //orderPrice
        var orderPrice = intent.getStringExtra("orderPrice")
        //SalesOrderDetailsActivity.SALES_ORDER_DB_ID
        var SALES_ORDER_DB_ID = intent.getStringExtra(SalesOrderDetailsActivity.SALES_ORDER_DB_ID)
        Log.e("SALES_ORDER_DB_ID", "" + SALES_ORDER_DB_ID)

        val salesOrderDataSource = SalesOrderDataSource(this)
        salesOrderDataSource.open()
        order = salesOrderDataSource.getOrderById(orderId)
        salesOrderDataSource.close()
        val randomNumber: Int = Random().nextInt(100000000)
        Log.e("randomNumber", "" + randomNumber)
        Log.e("orderNumber", "" + orderNumber)
        var getOrderNumber: String = orderNumber + ""
        Log.e("orderNumber", "" + getOrderNumber)
        val tvGasCustomerorderNumber = findViewById<TextView>(R.id.tvGasCustomerorderNumber)

        if (getOrderNumber.equals("null")) {
            tvGasCustomerorderNumber.text = "Order No: " + "D" + randomNumber
        } else {
            tvGasCustomerorderNumber.text = "Order No: " + orderNumber
        }

        //appendValue
        Log.e("orderTitles--> :", "" + orderTitles + ":" + orderPrice)
        Log.e("appendValue--> :", "" + appendValue)

        Log.e("orderPrice--> :", "" + appendValue)

        loadOrder(orderId)
        initData()

        Handler().postDelayed({
            if (isCashCustomer) {
                // For cash customers, create 2-page PDF
                createTwoPagePdf()
            } else {
                // For credit customers, keep existing logic
                bitmap = llPdf?.let { loadBitmapFromView(it, llPdf!!.width, llPdf!!.height) }
                createPdfFile()
            }
        }, 1000)
    }

    private fun createTwoPagePdf() {
        // First, create page 1 with regular items
        populatePageContent(regularItems, false) // false = not delivery page
        bitmap = llPdf?.let { loadBitmapFromView(it, llPdf!!.width, llPdf!!.height) }
        
        // Then create page 2 with delivery charges
        populatePageContent(deliveryChargeItems, true) // true = delivery page
        bitmap2 = llPdf?.let { loadBitmapFromView(it, llPdf!!.width, llPdf!!.height) }
        
        // Create the 2-page PDF
        createTwoPagePdfFile()
    }

    private fun populatePageContent(items: List<OrderMaterialInfo>, isDeliveryPage: Boolean) {
        // Clear existing table content
        val stk = findViewById(R.id.table_main) as TableLayout
        stk.removeAllViews()
        
        // Add header row
        val tbrow0 = TableRow(this)
        tbrow0.setLayoutParams(ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.FILL_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT))

        val tv0 = TextView(this)
        tv0.text = " S.No "
        tv0.gravity = Gravity.CENTER
        tv0.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        tv0.setTypeface(null, Typeface.BOLD);
        tv0.setTextColor(Color.BLACK)
        tbrow0.addView(tv0)
        
        val tv1 = TextView(this)
        tv1.text = "Description\nتفصیل "
        tv1.gravity = Gravity.CENTER
        tv1.setTextColor(Color.BLACK)
        tv1.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        tv1.setTypeface(null, Typeface.BOLD);
        tbrow0.addView(tv1)
        
        val tv2 = TextView(this)
        tv2.text = "Qty\n كمية"
        tv2.gravity = Gravity.CENTER
        tv2.setTypeface(null, Typeface.BOLD);
        tv2.setTextColor(Color.BLACK)
        tv2.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        tbrow0.addView(tv2)
        
        // Add Price and Total columns for cash customers
        if (isCashCustomer) {
            val tv3 = TextView(this)
            tv3.text = "Price\nقیمت"
            tv3.gravity = Gravity.CENTER
            tv3.setTypeface(null, Typeface.BOLD);
            tv3.setTextColor(Color.BLACK)
            tv3.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
            tbrow0.addView(tv3)
            
            val tv4 = TextView(this)
            tv4.text = "Total\nکل"
            tv4.gravity = Gravity.CENTER
            tv4.setTypeface(null, Typeface.BOLD);
            tv4.setTextColor(Color.BLACK)
            tv4.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
            tbrow0.addView(tv4)
        }
        
        stk.addView(tbrow0)

        val v = View(this)
        v.layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                5
        )
        v.setBackgroundColor(Color.parseColor("#B3B3B3"))
        stk.addView(v)

        var sum = 0.0
        
        // Add item rows
        for (i in items.indices) {
            val material = items[i]
            val tbrow = TableRow(this)

            val t1v = TextView(this)
            val addSno: Int = i + 1
            t1v.text = "" + addSno
            t1v.setTextColor(Color.BLACK)
            t1v.gravity = Gravity.CENTER
            t1v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
            t1v.setTypeface(null, Typeface.BOLD);
            tbrow.addView(t1v)
            
            val t2v = TextView(this)
            t2v.text = material.materialTitle + "\n" + material.fragName
            t2v.setTextColor(Color.BLACK)
            t2v.gravity = Gravity.CENTER
            t2v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
            t2v.setTypeface(null, Typeface.BOLD);
            tbrow.addView(t2v)

            val t3v = TextView(this)
            val s = Integer.toString(material.quantity)
            if (material.materialTitle.contains("Delivery Service Charge", true)) {
                t3v.text = ""
            } else {
                t3v.text = s
            }
            t3v.setTextColor(Color.BLACK)
            t3v.gravity = Gravity.CENTER
            t3v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
            t3v.setTypeface(null, Typeface.BOLD);
            tbrow.addView(t3v)

            if (isCashCustomer) {
                val t4v = TextView(this)
                val str_cost: String = "%.3f".format(material.cost.toBigDecimal())
                t4v.text = " " + str_cost + ""
                t4v.setTextColor(Color.BLACK)
                t4v.gravity = Gravity.CENTER
                t4v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f);
                t4v.setTypeface(null, Typeface.BOLD);
                tbrow.addView(t4v)

                val t5v = TextView(this)
                val actual = multiplyDecimal(material.cost.toDouble(), material.quantity.toDouble()).toDouble()
                val str_actual: String = "%.3f".format(actual)
                t5v.text = " " + str_actual + ""
                sum += actual;
                t5v.setTextColor(Color.BLACK)
                t5v.gravity = Gravity.CENTER
                t5v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f);
                t5v.setTypeface(null, Typeface.BOLD);
                tbrow.addView(t5v)
            }
            
            stk.addView(tbrow)
        }
        
        // Update total for this page
        if (isCashCustomer) {
            val gogasTotalPriceValue = findViewById<TextView>(R.id.gogasTotalPriceValue)
            val str_total: String = "%.3f".format(sum)
            gogasTotalPriceValue.text = str_total
        }
        
        // Update page title based on content
        val tv_goGasCashTitle = findViewById<TextView>(R.id.tv_goGasCashTitle)
        if (isDeliveryPage) {
            tv_goGasCashTitle.text = "Cash Invoice\n(Delivery Charges)"
        } else {
            tv_goGasCashTitle.text = "Cash Invoice\n(Items)"
        }
    }

    private fun createTwoPagePdfFile() {
        val wm = getSystemService(WINDOW_SERVICE) as WindowManager
        val displaymetrics = DisplayMetrics()
        this.windowManager.defaultDisplay.getMetrics(displaymetrics)
        val hight = displaymetrics.heightPixels.toFloat()
        val width = displaymetrics.widthPixels.toFloat()
        val convertHighet = hight.toInt()
        val convertWidth = width.toInt()
        val document = PdfDocument()
        
        // Create Page 1 (Regular Items)
        val pageInfo1 = PageInfo.Builder(convertWidth, convertHighet, 1).create()
        val page1 = document.startPage(pageInfo1)
        val canvas1 = page1.canvas
        val paint1 = Paint()
        canvas1.drawPaint(paint1)
        bitmap = bitmap?.let { Bitmap.createScaledBitmap(it, convertWidth, convertHighet, true) }
        paint1.color = Color.BLUE
        bitmap?.let { canvas1.drawBitmap(it, 0f, 0f, null) }
        document.finishPage(page1)
        
        // Create Page 2 (Delivery Charges)
        val pageInfo2 = PageInfo.Builder(convertWidth, convertHighet, 2).create()
        val page2 = document.startPage(pageInfo2)
        val canvas2 = page2.canvas
        val paint2 = Paint()
        canvas2.drawPaint(paint2)
        bitmap2 = bitmap2?.let { Bitmap.createScaledBitmap(it, convertWidth, convertHighet, true) }
        paint2.color = Color.BLUE
        bitmap2?.let { canvas2.drawBitmap(it, 0f, 0f, null) }
        document.finishPage(page2)
        
        var file_path = ""
        file_path = if (SDK_INT >= 30) {
            getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)!!.path + "/pdffromlayoutview.pdf"
        } else {
            Environment.getExternalStorageDirectory().path + "/pdffromlayoutview.pdf"
        }
        val filePath: File
        filePath = File(file_path)
        try {
            document.writeTo(FileOutputStream(filePath))
            Toast.makeText(this, "2-Page PDF is created!!!", Toast.LENGTH_SHORT).show()
        } catch (e: IOException) {
            e.printStackTrace()
            Log.e("Error_response", e.toString())
            Toast.makeText(this, "Something wrong: $e", Toast.LENGTH_LONG).show()
        }
        document.close()
        openGeneratedPDF()
    }


    private fun createPdfFile() {
        val wm = getSystemService(WINDOW_SERVICE) as WindowManager
        //  Display display = wm.getDefaultDisplay();
        //  Display display = wm.getDefaultDisplay();
        val displaymetrics = DisplayMetrics()
        this.windowManager.defaultDisplay.getMetrics(displaymetrics)
        val hight = displaymetrics.heightPixels.toFloat()
        val width = displaymetrics.widthPixels.toFloat()
        val convertHighet = hight.toInt()
        val convertWidth = width.toInt()
        val document = PdfDocument()
        val pageInfo = PageInfo.Builder(convertWidth, convertHighet, 1).create()
        val page = document.startPage(pageInfo)
        val canvas = page.canvas
        val paint = Paint()
        canvas.drawPaint(paint)
        bitmap = bitmap?.let { Bitmap.createScaledBitmap(it, convertWidth, convertHighet, true) }
        paint.color = Color.BLUE
        bitmap?.let { canvas.drawBitmap(it, 0f, 0f, null) }
        document.finishPage(page)
        var file_path = ""
        file_path = if (SDK_INT >= 30) {
            //           Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)!!.path + "/pdffromlayoutview.pdf"
            getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)!!.path + "/pdffromlayoutview.pdf"
        } else {
            Environment.getExternalStorageDirectory().path + "/pdffromlayoutview.pdf"
        }
        val filePath: File
        filePath = File(file_path)
        try {
            document.writeTo(FileOutputStream(filePath))
            Toast.makeText(this, "PDF is created!!!", Toast.LENGTH_SHORT).show()
        } catch (e: IOException) {
            e.printStackTrace()
            Log.e("Error_response", e.toString())
            Toast.makeText(this, "Something wrong: $e", Toast.LENGTH_LONG).show()
        }
        document.close()
        openGeneratedPDF()
    }

    //
    open fun loadBitmapFromView(v: View, width: Int, height: Int): Bitmap? {
        val options = BitmapFactory.Options()
        options.inPreferredConfig = Bitmap.Config.ARGB_8888
        // Bitmap bitmap = BitmapFactory.decodeFile(objElement, options);
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val c = Canvas(bitmap)
        v.draw(c)
        return bitmap
    }
    fun loadOrder(orderId: String?) {
        val salesOrderDataSource = SalesOrderDataSource(this)
        salesOrderDataSource.open()
        order = salesOrderDataSource.getOrderById(orderId)
        salesOrderDataSource.close()
    }

    fun initData() {
//      Log.e("Login Mail", "CustomerDeliveryName" + PreferenceHelper.getEmail(applicationContext))
        Log.e("Login SID", "CustomerDeliveryName" + PreferenceHelper.getUserStorageId(applicationContext))
        Log.e("isNoorCustomer", "" + order?.customer?.isNoorCustomer)
        val checkCash: String = order?.customer?.customerTypeTitle.toString()

        val isNoorCustomer: String? = order?.customer?.isNoorCustomer
        val isCashCustomerStr: String? = order?.customer?.isCashCustomer.toString()

        val isCreditCustomer: Boolean? = order?.customer?.isCreditCustomer

        Log.e("IS isCreditCustomer", "" + isCreditCustomer)
        Log.e("IS isCashCustomer", "" + isCashCustomerStr)
        Log.e("IS checkCash", "" + checkCash)

        // Set cash customer flag
        isCashCustomer = checkCash.contains("Cash") && isCreditCustomer == false

        var tv_goGasCashTitle = findViewById<TextView>(R.id.tv_goGasCashTitle)
        var hideNoorLayout = findViewById<LinearLayout>(R.id.hideNoorLayout)
        var hidegoGasLayout = findViewById<LinearLayout>(R.id.hidegoGasLayout)
        var noorbottomLayout = findViewById<LinearLayout>(R.id.noorbottomLayout)
        var bottomGoGas = findViewById<LinearLayout>(R.id.bottomGoGas)
        var goGasPriceDescLayout = findViewById<ConstraintLayout>(R.id.goGasPriceDescLayout)
        var goGasPriceDescDataView = findViewById<View>(R.id.goGasPriceDescDataView)

        var cashTotalLayout = findViewById<ConstraintLayout>(R.id.cashTotalLayout)

        var godasTotalDeliverymode = findViewById<ConstraintLayout>(R.id.godasTotalDeliverymode)

        var tv_noorHotelTitle = findViewById<TextView>(R.id.tv_noorHotelTitle)

        var tvCustomeNameCode = findViewById<TextView>(R.id.tvCustomeNameCode)

        var tvTotalTitle = findViewById<TextView>(R.id.tvTotalTitle)

        var tvGasCustomerId = findViewById<TextView>(R.id.tvGasCustomerId)
        var tvGasCustomerName = findViewById<TextView>(R.id.tvGasCustomerName)
        var tvGasCustomerFname = findViewById<TextView>(R.id.tvGasCustomerFname)
        var tvGasCustomerDate = findViewById<TextView>(R.id.tvGasCustomerDate)
        var tv_goGasName = findViewById<TextView>(R.id.tv_goGasName)
        var tvNoorCashInvoice = findViewById<TextView>(R.id.tvNoorCashInvoice)
        var gogasTotalPriceValue = findViewById<TextView>(R.id.gogasTotalPriceValue)

        var tvgoGasSnos = findViewById<TextView>(R.id.tvgoGasSnos)
        var tvgoGasSnosDelivery = findViewById<TextView>(R.id.tvgoGasSnosDelivery)
        var tvgoGasDesc = findViewById<TextView>(R.id.tvgoGasDesc)
        var tvgoGasDescDelivery = findViewById<TextView>(R.id.tvgoGasDescDelivery)
        var tvgoGasPrice = findViewById<TextView>(R.id.tvgoGasPrice)
        var tvgoGasTotal = findViewById<TextView>(R.id.tvgoGasTotal)

        var goGasTranportLayout = findViewById<ConstraintLayout>(R.id.goGasTranportLayout)

        if (isNoorCustomer.equals("false")) {

            tv_goGasCashTitle.visibility = View.VISIBLE
            hideNoorLayout.visibility = View.GONE
            hidegoGasLayout.visibility = View.VISIBLE
            noorbottomLayout.visibility = View.GONE

            bottomGoGas.visibility = View.VISIBLE
            if (checkCash.contains("Cash")) {
                tv_goGasCashTitle.text = "Cash Invoice"
                goGasPriceDescLayout.visibility = View.VISIBLE
                goGasPriceDescDataView.visibility = View.VISIBLE
                cashTotalLayout.visibility = View.VISIBLE
                godasTotalDeliverymode.visibility = View.GONE
            } else {
                tv_goGasCashTitle.text = "Delivery Note\nCredit"
                goGasPriceDescLayout.visibility = View.VISIBLE
                godasTotalDeliverymode.visibility = View.GONE
                goGasPriceDescDataView.visibility = View.VISIBLE
                cashTotalLayout.visibility = View.GONE

            }
        } else {
            noorbottomLayout.visibility = View.VISIBLE
            bottomGoGas.visibility = View.GONE
            tv_noorHotelTitle.visibility = View.VISIBLE

            //
            if (checkCash.contains("Cash")) {
                Log.e("Noor", "Cash")
            } else {
                Log.e("Noor", "Delivery")
                tvCustomeNameCode.text = "Customer Name & Code\nDelivery Note\nCredit"
            }
            //


            if (isCreditCustomer == false) {
                tvTotalTitle.text = "Document Total :"
                tvNoorCashInvoice.setTypeface(null, Typeface.BOLD);
                tvNoorCashInvoice.setTextColor(Color.BLACK)
                tvNoorCashInvoice.text = "Cash Invoice \n Gas Transport"
            } else {
                cashTotalLayout.visibility = View.GONE
            }


            hideNoorLayout.visibility = View.VISIBLE
            hidegoGasLayout.visibility = View.GONE
        }


        val c: Calendar = Calendar.getInstance()
        val day: Int = c.get(Calendar.DAY_OF_MONTH)
        val month: Int = c.get(Calendar.MONTH) + 1
        val year: Int = c.get(Calendar.YEAR)
        var strDate: String = day.toString()
        var strMonth: String = month.toString()

        if (day.toString().length == 1) {
            strDate = "0" + day
        }
        if (strMonth.length == 1) {
            strMonth = "0" + month
        }
        val date = strDate + "-" + strMonth + "-" + year

        /*   customerBillDate.text = "Date : "+date
         customerBillOrderId.text ="OrderNo :"+order?.customer?.accountingId
      */
        //
        tvGasCustomerId.text = order?.customer?.id
        tvGasCustomerName.text = order?.customer?.name
        tvGasCustomerFname.text = order?.customer?.fname
        tvGasCustomerDate.text = "Date :" + date
        //  tvGasCustomerorderNumber.text = "Order No :"+order?.customer?.id
        tv_goGasName.text = PreferenceHelper.getname(applicationContext)
        //


        val users = ArrayList<CustomerPricingInfo>()


        var singleString = String()
        var priceString = String()
        //cashCustomer_sno
        var cashCustomerSnoString = String()
        var cashCustomerSnoInt: Integer
        var addpriceValue: Int
        var addingpriceValue: DecimalFormat
        var TotalValue: DecimalFormat
        var input: Double
        var input1: Double
        val number = 3.141341435
        var getTotal: Int
        var getTotal1: Int

        var rem: Double
        var sum = 0.0

        var listOfMaterials: List<OrderMaterialInfo>? = null

        listOfMaterials = (order as OrderWithMaterialInfoAndOwner).materialInfoRequestedMaterial
        Log.e("List Size", "" + listOfMaterials.size);

        // Separate items into regular items and delivery charges for cash customers
        if (isCashCustomer) {
            deliveryChargeItems.clear()
            regularItems.clear()
            
            for (material in listOfMaterials) {
                if (material.materialTitle.contains("Delivery Service Charge", true)) {
                    deliveryChargeItems.add(material)
                } else {
                    regularItems.add(material)
                }
            }
            
            // For cash customers, don't populate table here as it will be done in createTwoPagePdf()
            return
        }

        val stk = findViewById(R.id.table_main) as TableLayout
        /* goGasPriceDescLayout.setLayoutParams(ConstraintLayout.LayoutParams(
                 ConstraintLayout.LayoutParams.MATCH_PARENT,
                 ConstraintLayout.LayoutParams.WRAP_CONTENT))*/
        val params = goGasPriceDescLayout.layoutParams as ConstraintLayout.LayoutParams
        params.topToBottom = goGasTranportLayout.id
        goGasPriceDescLayout.requestLayout()


        val tbrow0 = TableRow(this)

        tbrow0.setLayoutParams(ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.FILL_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT))

        val tv0 = TextView(this)
        tv0.text = " S.No "
        tv0.gravity = Gravity.CENTER
//        tv0.width= ViewGroup.LayoutParams.WRAP_CONTENT;
        //  tv0.width= 80
        tv0.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        tv0.setTypeface(null, Typeface.BOLD);

        tv0.setTextColor(Color.BLACK)
        tbrow0.addView(tv0)
        val tv1 = TextView(this)
        tv1.text = "Description\nتفصیل "
        tv1.gravity = Gravity.CENTER

        tv1.setTextColor(Color.BLACK)
        tv1.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);

        tv1.setTypeface(null, Typeface.BOLD);

        tbrow0.addView(tv1)
        val tv2 = TextView(this)
        tv2.text = "Qty\n كمية"
        tv2.gravity = Gravity.CENTER
        tv2.setTypeface(null, Typeface.BOLD);
        tv2.setTextColor(Color.BLACK)
        tv2.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);

        tbrow0.addView(tv2)
        if (checkCash.contains("Cash") && isCreditCustomer == false) {

        }
        stk.addView(tbrow0)

        val v = View(this)
        v.layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                5
        )
        v.setBackgroundColor(Color.parseColor("#B3B3B3"))

        stk.addView(v)

        for (i in 0 until listOfMaterials.size) {
            var material = listOfMaterials[i]


            val tbrow = TableRow(this)

            val t1v = TextView(this)
            val sno: Int = i.toInt()

            val addSno: Int = sno + 1

            t1v.text = "" + addSno

            t1v.setTextColor(Color.BLACK)
            t1v.gravity = Gravity.CENTER
            t1v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
            t1v.setTypeface(null, Typeface.BOLD);

            tbrow.addView(t1v)
            val t2v = TextView(this)
            t2v.text = material.materialTitle + "\n" + material.fragName
            t2v.setTextColor(Color.BLACK)
            t2v.gravity = Gravity.CENTER
            t2v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
            t2v.setTypeface(null, Typeface.BOLD);

            //  t2v.setTextSize(TypedValue.COMPLEX_UNIT_SP,10f);
            tbrow.addView(t2v)


            val t3v = TextView(this)


            val s = Integer.toString(material.quantity)
            //    Log.e("material_qty", material.materialId + "--" + material.quantity)

            if (material.materialTitle.contains("Delivery Service Charge", true)) {
                t3v.text = ""
            } else {
                t3v.text = s
            }

            t3v.setTextColor(Color.BLACK)
            t3v.gravity = Gravity.CENTER
            t3v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
            t3v.setTypeface(null, Typeface.BOLD);

            tbrow.addView(t3v)
            val t4v = TextView(this)
            t4v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f);
            t4v.setTypeface(null, Typeface.BOLD);

            if (checkCash.contains("Cash") && isCreditCustomer == false) {
                val currentString = material.cost

                val number = material.cost.toDouble()
                Log.e("Price", "" + number);

                val separated: List<String> = currentString.split(".")
                val t5v = TextView(this)
                val actual = multiplyDecimal(material.cost.toDouble(), material.quantity.toDouble()).toDouble()
                t5v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f);

                t5v.setTypeface(null, Typeface.BOLD);

                val str_actual: String = "%.3f".format(actual)
                Log.e("Test_Sum", "" + str_actual)
                t5v.text = " " + str_actual + ""
                sum += actual;
                Log.e("sum", "" + sum)

                val str_sum: String = sum.toString()
                val str_total: String = "%.3f".format(str_sum.toBigDecimal())

                // val str_total: String = "$.3f".format(sum)
                Log.e("Test_total", "" + str_total)
                val strTotalvalue: String = java.lang.String.valueOf(sum)
                Log.e("strTotalvalue", "" + strTotalvalue);


                gogasTotalPriceValue.text = str_total + ""



                val str_cost: String = "%.3f".format(material.cost.toBigDecimal())
                Log.e("Test_cost", "" + str_cost)
                t4v.text = " " + str_cost + ""


                t4v.setTextColor(Color.BLACK)
                t4v.gravity = Gravity.CENTER

                t5v.setTextColor(Color.BLACK)
                t5v.gravity = Gravity.CENTER
                //  tbrow.addView(t5v)// customer asked to remve this part for cash invoice as well
            }
            stk.addView(tbrow)
        }
        var len = 0


        len = listOfMaterials.size

        for (i in 0 until len) {
            users.add(CustomerPricingInfo())

            var material = listOfMaterials[i]

            Log.e("### materialTitle", "" + material.fragName)
            Log.e("### quantity", "" + material.quantity)
            Log.e("### totalCost", "" + material.totalCost)
            Log.e("### materialId", "" + material.materialId)
            Log.e("### id", "" + material.id)
            Log.e("### materialUiId", "" + material.materialUiId)
            Log.e("### materialIdRef", "" + material.materialIdRef)

            //  input= order?.customer?.pricingInfo!!.get(i).price.toDouble()
            var num = material.cost.toDouble()

            singleString = singleString + order?.customer?.pricingInfo!!.get(i).material.title + " \n";

            priceString = priceString + order?.customer?.pricingInfo!!.get(i).price + "\n";

            Log.e("ii", "" + i + 1)

            var serialno: Int = i.toInt()

            if (i == 0) {
                serialno = 1;
            }

            if (i == 1) {
                serialno = 2;
            }

            if (i == 2) {
                serialno = 3;
            }

            if (i == 3) {
                serialno = 4;
            }

            if (i == 4) {
                serialno = 5;
            }

            cashCustomerSnoString = cashCustomerSnoString + "" + serialno + "\n"


        }

        tvgoGasSnos.text = cashCustomerSnoString
        tvgoGasSnosDelivery.text = cashCustomerSnoString
        tvgoGasDesc.text = singleString
        tvgoGasDescDelivery.text = singleString
        tvgoGasPrice.text = priceString + ".00"
        tvgoGasTotal.text = priceString + ".00"

        for (i in order?.customer?.pricingInfo.toString().indices) {

        }


    }

    private fun getOutputStream(): OutputStream {
        var path = Environment.getExternalStorageDirectory()
        path = File(path.absoluteFile.toString() + "/GoGas")
        path.mkdir()

        val file = File(path, "pdffromlayout789.pdf")
        return FileOutputStream(file)
    }




    //
    fun multiplyDecimal(a: Double, b: Double): BigDecimal {
        return BigDecimal(b).multiply(BigDecimal(a))
    }

    //
    private fun viewPdf(s: String, s1: String) {
        val pdfFile = File(Environment.getExternalStorageDirectory().toString() + "/" + s1 + "/" + s)
        val path: Uri = Uri.fromFile(pdfFile)
        Log.e("VIEW", "View Pdf")
        // Setting the intent for pdf reader
        val pdfIntent = Intent(Intent.ACTION_VIEW)
        pdfIntent.setDataAndType(path, "application/pdf")
        pdfIntent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP

        try {
            startActivity(pdfIntent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "Can't read pdf file", Toast.LENGTH_SHORT).show()
        }
    }

    private fun openGeneratedPDF() {
        if (SDK_INT >= Build.VERSION_CODES.N && SDK_INT < Build.VERSION_CODES.R) {
            //  val file2 = File(this.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS + File.separator + "gogas")?.path + "/pdffromlayoutview.pdf")
            val file = File(Environment.getExternalStorageDirectory().path + "/pdffromlayoutview.pdf")
            val uri = FileProvider.getUriForFile(this, "$packageName.provider", file)
            intent = Intent(Intent.ACTION_VIEW)
            intent.data = uri
            intent.flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
            startActivity(intent)
        } else if (SDK_INT >= Build.VERSION_CODES.R) {

            //  val file = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)!!.path + "/pdffromlayoutview.pdf")
            val file = File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)!!.path + "/pdffromlayoutview.pdf")
            val uri = FileProvider.getUriForFile(this, "$packageName.provider", file)
            intent = Intent(Intent.ACTION_VIEW)
            intent.setDataAndType(uri, "application/pdf")
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
            intent.flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
            startActivity(intent)
        } else {
            val file = File(Environment.getExternalStorageDirectory().absolutePath + "/pdffromlayoutview.pdf")
            intent = Intent(Intent.ACTION_VIEW)
            intent.setDataAndType(Uri.parse(file.toString()), "application/pdf")
            intent = Intent.createChooser(intent, "Open File")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
        }
    }

    fun openPdf(context: Context, path: String?) {
        val file = File(path)
        FileOpen.openFile(context, file);
        try {
            val url = file.absolutePath
            val u = "content:///$url"
            val i = Intent(Intent.ACTION_VIEW)
            i.setDataAndType(Uri.fromFile(file), "application/pdf")
            i.data = Uri.parse(u)
            startActivity(i)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        Log.e("filefilefilsse", "" + file);

        if (file.exists()) {
            val intent = Intent(Intent.ACTION_VIEW)
            intent.setDataAndType(Uri.fromFile(file), "application/pdf")
            val pm: PackageManager = context.getPackageManager()
            val sendIntent = Intent(Intent.ACTION_VIEW)
            sendIntent.type = "application/pdf"
            val openInChooser = Intent.createChooser(intent, "Choose")
            val resInfo = pm.queryIntentActivities(sendIntent, 0)
            if (resInfo.size > 0) {
                try {
                    context.startActivity(openInChooser)
                } catch (throwable: Throwable) {
                    Toast.makeText(context, "PDF apps are not installed", Toast.LENGTH_SHORT).show()
                    // PDF apps are not installed
                }
            } else {
                Toast.makeText(context, "PDF apps are not installed", Toast.LENGTH_SHORT).show()
            }
        }
    }


    object FileOpen {
        @Throws(IOException::class)
        fun openFile(context: Context, url: File) {
            // Create URI
            val uri = Uri.fromFile(url)
            val intent = Intent(Intent.ACTION_VIEW)
            // Check what kind of file you are trying to open, by comparing the url with extensions.
            // When the if condition is matched, plugin sets the correct intent (mime) type,
            // so Android knew what application to use to open the file
            if (url.toString().contains(".doc") || url.toString().contains(".docx")) {
                // Word document
                intent.setDataAndType(uri, "application/msword")
            } else if (url.toString().contains(".pdf")) {
                // PDF file
                intent.setDataAndType(uri, "application/pdf")
            } else if (url.toString().contains(".ppt") || url.toString().contains(".pptx")) {
                // Powerpoint file
                intent.setDataAndType(uri, "application/vnd.ms-powerpoint")
            } else if (url.toString().contains(".xls") || url.toString().contains(".xlsx")) {
                // Excel file
                intent.setDataAndType(uri, "application/vnd.ms-excel")
            } else if (url.toString().contains(".zip") || url.toString().contains(".rar")) {
                // WAV audio file
                intent.setDataAndType(uri, "application/x-wav")
            } else if (url.toString().contains(".rtf")) {
                // RTF file
                intent.setDataAndType(uri, "application/rtf")
            } else if (url.toString().contains(".wav") || url.toString().contains(".mp3")) {
                // WAV audio file
                intent.setDataAndType(uri, "audio/x-wav")
            } else if (url.toString().contains(".gif")) {
                // GIF file
                intent.setDataAndType(uri, "image/gif")
            } else if (url.toString().contains(".jpg") || url.toString().contains(".jpeg") || url.toString().contains(".png")) {
                // JPG file
                intent.setDataAndType(uri, "image/jpeg")
            } else if (url.toString().contains(".txt")) {
                // Text file
                intent.setDataAndType(uri, "text/plain")
            } else if (url.toString().contains(".3gp") || url.toString().contains(".mpg") || url.toString().contains(".mpeg") || url.toString().contains(".mpe") || url.toString().contains(".mp4") || url.toString().contains(".avi")) {
                // Video files
                intent.setDataAndType(uri, "video/*")
            } else {
                intent.setDataAndType(uri, "*/*")
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }
}